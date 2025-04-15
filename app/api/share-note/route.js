import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }

    const senderId = payload.userId || payload._id || payload.sub || payload.id;
    if (!senderId) return new Response(JSON.stringify({ error: "Sender ID missing" }), { status: 400 });

    const { recipientUsername, title, text, noteId } = await req.json();
    if (!recipientUsername || !title || !text) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("SmartEditor4U");
    const users = db.collection("users");

    const recipient = await users.findOne({ username: recipientUsername, paidUser: true });
    if (!recipient) {
      return new Response(JSON.stringify({ error: "Recipient not found or not a paid user" }), { status: 404 });
    }

    const recipientId = recipient._id.toString();

    if (noteId) {
      // 🔁 Existing note: re-share logic
      const sender = await users.findOne({ _id: new ObjectId(senderId) });
      const existingNote = sender?.sharedNotes?.find(n => n.noteId === noteId);

      if (!existingNote) {
        return new Response(JSON.stringify({ error: "Note not found to re-share" }), { status: 404 });
      }

      // 🧠 Add recipient to original note's collaborators
      const senderUpdate = await users.updateOne(
        { _id: new ObjectId(senderId), "sharedNotes.noteId": noteId },
        {
          $addToSet: {
            "sharedNotes.$.collaborators": recipientId,
            "sharedNotes.$.invites": { userId: recipientId, accepted: false }
          }
        }
      );

      if (senderUpdate.modifiedCount === 0) {
        return new Response(JSON.stringify({ error: "Note not updated for sender" }), { status: 500 });
      }

      // 💸 Deduct 3 tokens for re-sharing
      await users.updateOne(
        { _id: new ObjectId(senderId) },
        { $inc: { tokens: -3 } }
      );

      // 📨 Send invite to recipient
      await users.updateOne(
        { _id: recipient._id },
        {
          $push: {
            invites: {
              noteId,
              title,
              text,
              createdBy: senderId,
              createdAt: new Date()
            }
          }
        }
      );

      return new Response(JSON.stringify({ success: true, message: "Note re-shared" }), { status: 200 });

    } else {
      // 🆕 New note sharing
      const newNoteId = new ObjectId().toString();
      const note = {
        noteId: newNoteId,
        title,
        text,
        createdBy: senderId,
        collaborators: [recipientId],
        createdAt: new Date(),
        updatedAt: new Date(),
        invitePending: true,
        invites: [{ userId: recipientId, accepted: false }]
      };

      const senderUpdate = await users.updateOne(
        { _id: new ObjectId(senderId) },
        { $push: { sharedNotes: note } }
      );

      if (senderUpdate.modifiedCount === 0) {
        return new Response(JSON.stringify({ error: "Note not saved to sender" }), { status: 500 });
      }

      // 💸 Deduct 3 tokens for new share
      await users.updateOne(
        { _id: new ObjectId(senderId) },
        { $inc: { tokens: -3 } }
      );

      const invite = {
        noteId: newNoteId,
        title,
        text,
        createdBy: senderId,
        createdAt: new Date()
      };

      const recipientUpdate = await users.updateOne(
        { _id: recipient._id },
        { $push: { invites: invite } }
      );

      if (recipientUpdate.modifiedCount === 0) {
        return new Response(JSON.stringify({ error: "Invite not saved" }), { status: 500 });
      }

      return new Response(JSON.stringify({ success: true, message: "Note shared" }), { status: 200 });
    }

  } catch (err) {
    console.error("❌ Server error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
