import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }

    const userId = payload.userId || payload._id || payload.id || payload.sub;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing user ID" }), { status: 400 });
    }

    const { noteId, text } = await req.json();

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("SmartEditor4U");
    const users = db.collection("users");

    const updateResult = await users.updateMany(
      {
        "sharedNotes.noteId": noteId
      },
      {
        $set: {
          "sharedNotes.$[elem].text": text,
          "sharedNotes.$[elem].updatedAt": new Date()
        }
      },
      {
        arrayFilters: [{ "elem.noteId": noteId }]
      }
    );
    
    if (updateResult.modifiedCount === 0) {
      return new Response(JSON.stringify({ error: "Note not updated" }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    console.error("❌ Error updating shared note:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
