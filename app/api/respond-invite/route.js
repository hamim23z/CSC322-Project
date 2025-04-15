import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = new ObjectId(payload.id);

    const { noteId, accepted } = await req.json();

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("SmartEditor4U");
    const users = db.collection("users");

    // 🔍 Pull invite
    const user = await users.findOne({ _id: userId });
    const invite = user?.invites?.find(i => i.noteId === noteId);
    if (!invite) {
      return new Response(JSON.stringify({ error: "Invite not found" }), { status: 404 });
    }

    // ❌ Remove invite from user
    await users.updateOne({ _id: userId }, { $pull: { invites: { noteId } } });

    if (!accepted) {
      // 🛑 Apply penalty
      await users.updateOne(
        { _id: new ObjectId(invite.createdBy) },
        { $inc: { tokens: -3 } }
      );
      return new Response(JSON.stringify({ success: true, message: "Invite rejected" }), { status: 200 });
    }

    // ✅ If accepted, fetch original shared note from sender
    const sender = await users.findOne({
      _id: new ObjectId(invite.createdBy),
      "sharedNotes.noteId": noteId
    });

    const note = sender?.sharedNotes?.find(n => n.noteId === noteId);
    if (!note) {
      return new Response(JSON.stringify({ error: "Note not found on sender" }), { status: 404 });
    }

    // ✅ Update sender: add recipient as collaborator
    await users.updateOne(
      { _id: new ObjectId(invite.createdBy), "sharedNotes.noteId": noteId },
      { $addToSet: { "sharedNotes.$.collaborators": userId.toString() } }
    );

    // ✅ Save full note copy to recipient’s sharedNotes
    const sharedNoteForRecipient = {
      ...note,
      invitePending: false,
      collaborators: [...(note.collaborators || []), userId.toString()],
      invites: [] // optional: you can strip or leave
    };

    await users.updateOne(
      { _id: userId },
      { $push: { sharedNotes: sharedNoteForRecipient } }
    );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("❌ Error in respond-invite:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
