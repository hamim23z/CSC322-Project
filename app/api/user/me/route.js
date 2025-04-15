// app/api/user/me/route.js
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export async function GET(req) {
  const token = req.headers.get('authorization')?.split(' ')[1];

  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("SmartEditor4U");
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.id) });

    if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

    const { password, ...safeUser } = user;

    // 🆕 Ensure default empty arrays
    safeUser.sharedNotes = user.sharedNotes || [];
    safeUser.invites = user.invites || [];

    return new Response(JSON.stringify(safeUser), { status: 200 });
  } catch (err) {
    console.error("Token verify failed", err);
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 403 });
  }
}
