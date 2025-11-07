import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
let client;

async function connectDB() {
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

// helper to get db instance anywhere
export async function getDB() {
  if (!client) throw new Error("MongoDB client not initialized");
  return client.db("srsDB");
}

export default connectDB;
