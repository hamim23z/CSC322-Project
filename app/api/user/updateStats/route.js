import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const statsUpdate = await req.json();

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("SmartEditor4U");
    const users = db.collection("users");

    // Increment only the values provided
    const incFields = {};
    for (const key in statsUpdate) {
      if (statsUpdate[key] !== 0) {
        incFields[`stats.${key}`] = statsUpdate[key];
      }
    }

    const result = await users.updateOne(
      { _id: new ObjectId(payload.id) },
      { $inc: incFields }
    );

    client.close();

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    console.error("Stats update error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
