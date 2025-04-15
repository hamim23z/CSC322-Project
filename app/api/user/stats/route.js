import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("SmartEditor4U");
    const users = db.collection("users");

    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      client.close();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const stats = {
      selfCorrections: user.stats?.selfCorrections || 0,
      llmCorrections: user.stats?.llmCorrections || 0,
      tokensUsed: user.stats?.tokensUsed || 0,
      tokensEarned: user.stats?.tokensEarned || 0,
    };

    client.close();
    return NextResponse.json(stats);

  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
