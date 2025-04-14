import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  const { email, password } = await req.json();

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  const db = client.db("SmartEditor4U");
  const user = await db.collection("users").findOne({ email });

  if (!user) {
    client.close();
    return new Response(
      JSON.stringify({ error: "Invalid email or password" }),
      { status: 401 }
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    client.close();
    return new Response(
      JSON.stringify({ error: "Invalid email or password" }),
      { status: 401 }
    );
  }

  // ✅ Create JWT Token
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1hr" }
  );

  // ✅ Return token + user info
  client.close();

  return new Response(
    JSON.stringify({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        paidUser: !!user.paidUser,
        admin: !!user.admin,
        tokens: parseInt(user.tokens || 0),
      },
    }),
    { status: 200 }
  );
}
