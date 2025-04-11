// app/api/user/[id]/tokens/route.js
import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/db';
import User from '@/models/User'; 

export async function GET(req, { params }) {
  await connectToDB();
  const user = await User.findById(params.id);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ tokens: user.tokens });
}

export async function POST(req, { params }) {
  await connectToDB();
  const body = await req.json();
  const { tokens } = body;

  const user = await User.findByIdAndUpdate(
    params.id,
    { tokens },
    { new: true }
  );

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ tokens: user.tokens });
}
