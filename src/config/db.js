import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
// const port=process.env.PORT
// console.log("MONGO_URI:", uri, port);

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

export default connectDB;
