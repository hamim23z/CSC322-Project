// app/api/blacklist/submit/route.js
import { MongoClient } from 'mongodb';
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
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { words } = await req.json();
  if (!words || typeof words !== "string") {
    return NextResponse.json({ error: "Words must be a comma-separated string" }, { status: 400 });
  }

  const parsedWords = words
    .split(",")
    .map(w => w.trim().toLowerCase())
    .filter(Boolean);

  if (parsedWords.length === 0) {
    return NextResponse.json({ error: "No valid words provided" }, { status: 400 });
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db("SmartEditor4U");

  const existing = await db.collection("blacklist_words").find({
    word: { $in: parsedWords }
  }).toArray();

  const existingWords = new Set(existing.map(w => w.word));
  const newWords = parsedWords.filter(w => !existingWords.has(w));

  if (newWords.length > 0) {
    await db.collection("blacklist_words").insertMany(
      newWords.map(word => ({
        word,
        status: "pending",
        submittedAt: new Date(),
        submittedBy: payload.email || payload.userId
      }))
    );
  }

  return NextResponse.json({ added: newWords.length });
}
