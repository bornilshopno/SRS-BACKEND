import cloudinary from "../../config/cloudinaryConfig.js";
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

export async function uploadFileAndSaveToUser(filePath, email) {
  const userCollection = await getCollection("users");

  try {
    // 1️⃣ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });

    // 2️⃣ Save the Cloudinary URL to this user's document
    const updateResult = await userCollection.updateOne(
      { email },
      { $set: { profileImage: result.secure_url } } // You can rename field as you like
    );

    if (updateResult.matchedCount === 0) {
      throw new Error("User not found");
    }

    // 3️⃣ Return both
    return { url: result.secure_url, updated: updateResult.modifiedCount > 0 };
  } catch (error) {
    throw new Error("Upload or DB update failed: " + error.message);
  }
}

export const updateUserPersonalService = async (email, updatedDoc) => {
  const userCollection = await getCollection("users");
  const filter = { email };
  const updatedDocument = {
    $set: { ...updatedDoc },
  };
  console.log("from service", updatedDocument)
  const result = await userCollection.updateOne(filter, updatedDocument);
  return result;
};

export const updateUserResidenceService = async (email, updatedDoc) => {
  const userCollection = await getCollection("users");
  const filter = { email };
  const updatedDocument = {
     $set: { residentialHistory: updatedDoc }
  }
  console.log("from SERVICE",updatedDocument)
  const result = await userCollection.updateOne(filter, updatedDocument);
  return result;
}



// not used yet
export async function verifyUser(email, password) {
  // Normally you'd fetch and compare from DB
  return { id: 1, email };
}
