import { getCollection } from "../../utils/getCollection.js";


export async function findUserByEmail(email) {
  const userCollection = await getCollection("users");
  return await userCollection.findOne({ email });
}

export async function createUser(userData) {
  const userCollection = await getCollection("users");
  const result = await userCollection.insertOne(userData);
  return result;
}

export async function getUserByEmail(email) {
  const userCollection = await getCollection("users");
  const query = { email };
  const user = await userCollection.findOne(query);
  return user;
}

// not used yet
export async function verifyUser(email, password) {
  // Normally you'd fetch and compare from DB
  return { id: 1, email };
}
