import { getDB } from "../config/db.js";


export async function getCollection(name) {
  const db = await getDB();
  return db.collection(name);
}


