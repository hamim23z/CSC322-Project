

import { MongoClient, ObjectId } from 'mongodb';
import jwt from "jsonwebtoken";

export async function GET(req) {
    const token = req.headers.get("authorization")?.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const adminId = payload.userId || payload._id || payload.id || payload.sub;

  
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("SmartEditor4U");
    const users = db.collection("users");
  
    const adminUser = await users.findOne({ _id: new ObjectId(adminId) });
    if (!adminUser?.admin) {
      return new Response("Forbidden", { status: 403 });
    }
  
    const queue = await users.aggregate([
      { $match: { "llmRejectQueue.status": "pending" } },
      { $project: {
          username: 1,
          queue: {
            $filter: {
              input: "$llmRejectQueue",
              as: "item",
              cond: { $eq: ["$$item.status", "pending"] }
            }
          }
        }
      }
    ]).toArray();
  
    return new Response(JSON.stringify(queue), { status: 200 });
  }
  
