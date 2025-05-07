
import { MongoClient, ObjectId } from 'mongodb';
import jwt from "jsonwebtoken";

  export async function POST(req) {
    const token = req.headers.get("authorization")?.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
  
    const adminId = payload.userId || payload._id || payload.id || payload.sub;

  
    const { userId, timestamp, action } = await req.json(); // action: "accept" | "reject"
  
    const cost = action === "accept" ? 1 : 5;
  
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("SmartEditor4U");
    const users = db.collection("users");
  
    const adminUser = await users.findOne({ _id: new ObjectId(adminId) });
    if (!adminUser?.admin) return new Response("Forbidden", { status: 403 });
  
    await users.updateOne(
      { _id: new ObjectId(userId), "llmRejectQueue.timestamp": new Date(timestamp) },
      {
        $set: { "llmRejectQueue.$.status": action },
        $inc: { tokens: -cost }
      }
    );
  
    return new Response(JSON.stringify({ success: true, cost }), { status: 200 });
  }
  