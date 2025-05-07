
import { MongoClient, ObjectId } from 'mongodb';
import jwt from "jsonwebtoken";

export async function POST(req) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return new Response("Unauthorized", { status: 401 });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
  }

  const userId = payload.userId || payload._id || payload.id || payload.sub;
  if (!userId) {
    console.error("❌ No user ID found in token payload:", payload);
    return new Response(JSON.stringify({ error: "Missing user ID" }), { status: 400 });
  }

  const { original, corrected, reason } = await req.json();

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db("SmartEditor4U");
  const users = db.collection("users");

  const result = await users.updateOne(
    { _id: new ObjectId(userId) },
    {
      $push: {
        llmRejectQueue: {
          original,
          corrected,
          reason,
          timestamp: new Date(),
          status: "pending"
        }
      }
    }
  );

  console.log("✅ userId:", userId);
  console.log("🛠️ Update result:", result);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
