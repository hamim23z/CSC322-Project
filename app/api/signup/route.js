// app/api/signup/route.js
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const body = await req.json();

    const { firstName, lastName, email, username, password, paidUser, admin, tokens } = body;

    if (!firstName || !lastName || !email || !username || !password) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
      });
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("SmartEditor4U");
    const users = db.collection("users");

    // 🚫 Check for duplicate email or username
    const existingUser = await users.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Email or username already in use' }), {
        status: 409, // Conflict
      });
    }

    // 🔐 Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create the user object
    const newUser = {
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword,
      paidUser: !!paidUser,
      admin: Boolean(admin),
      tokens: parseInt(tokens) || 20,
      createdAt: new Date(),
      sharedNotes: [
        {
          noteId: ObjectId,
          title: String,
          text: String,
          ownerId: ObjectId,
          lastUpdated: Date
        }
      ],
       // 🆕 New field added here
      stats: {
        selfCorrections: 0,
        llmCorrections: 0,
        tokensUsed: 0,
        tokensEarned: 0,
      },
    };

    const result = await users.insertOne(newUser);
    client.close();

    return new Response(JSON.stringify({ success: true, userId: result.insertedId }), {
      status: 201,
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
    });
  }
}
