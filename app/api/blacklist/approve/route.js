import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const userId = payload.userId || payload._id || payload.id || payload.sub;
  if (!userId) {
    return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db("SmartEditor4U");



  const { words } = await req.json();
  if (!Array.isArray(words) || words.length === 0) {
    return NextResponse.json({ error: "Invalid word list" }, { status: 400 });
  }

  const now = new Date();
  const result = await db.collection("blacklist_words").updateMany(
    { word: { $in: words }, status: "pending" },
    { $set: { status: "approved", approvedAt: now } }
  );

  return NextResponse.json({ approved: result.modifiedCount });
}
