// app/api/blacklist/queue/route.js
import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
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

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db("SmartEditor4U");


  const pending = await db.collection("blacklist_words").find({ status: "pending" }).toArray();
  return NextResponse.json(pending);
}
