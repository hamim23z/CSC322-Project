import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { tokens } = await req.json();

    await client.connect();
    const db = client.db("SmartEditor4U");
    const users = db.collection("users");

    const result = await users.updateOne(
      { _id: new ObjectId(payload.id) },
      { $set: { tokens } }
    );

    if (result.modifiedCount === 1) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

  } catch (err) {
    console.error("Token update error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });

  } finally {
    await client.close();
  }
}
