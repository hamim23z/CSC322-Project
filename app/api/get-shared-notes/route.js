import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized (no token)" }), { status: 401 });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("SmartEditor4U");
    const users = db.collection("users");

    const userId = payload.userId || payload._id || payload.id || payload.sub;
    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({
      notes: [
        ...(user.sharedNotes || []),
        ...(user.invites || []).map(invite => ({
          ...invite,
          invitePending: true
        }))
      ]
    }), { status: 200 });

  } catch (err) {
    console.error("❌ Error fetching shared notes:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
