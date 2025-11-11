import { getCollection } from "../../utils/getCollection.js";

export const getTerms = async () => {
  try {
    const termsCollection = await getCollection("terms");
    const termsDoc = await termsCollection.find({}).toArray(); 
    return termsDoc;
  } catch (error) {
    throw new Error("Failed to fetch terms from database");
  }
};