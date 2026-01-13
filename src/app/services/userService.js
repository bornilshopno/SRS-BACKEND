import { ObjectId } from "mongodb";
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

export async function getUserById(id) {
  const userCollection = await getCollection("users");
  const query = { _id: new ObjectId(id) };
  const user = await userCollection.findOne(query);
  return user;
}

export async function getAllUsers({ search, sortBy, role, fromDate, toDate }) {
  const userCollection = await getCollection("users");

  let query = {
    $or: [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ]
  };

  // Role filter
  if (role) query.role = role;

  // Date range filter for submittedAt field. if field changes then replace it
  if (fromDate && toDate) {
    query.submitteddAt = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    };
  }

  let cursor = userCollection.find(query);

  // Sorting
  if (sortBy) cursor = cursor.sort({ [sortBy]: 1 });

  return await cursor.toArray();
}


export async function uploadFileAndSaveToUser(filePath, filekey, email) {
  const userCollection = await getCollection("users");
  console.log("fromService, fileKey")
  try {
    // 1️⃣ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });

    // 2️⃣ Save the Cloudinary URL to this user's document
    const updateResult = await userCollection.updateOne(
      { email },
      { $set: { [filekey]: result.secure_url } } // You can rename field as you like
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
  console.log("from SERVICE", updatedDocument)
  const result = await userCollection.updateOne(filter, updatedDocument);
  return result;
}


export const createEmployeeService = async ({
  name,
  email,
  initialKey,
  phone,
  role,
}) => {
  let userRecord;

  try {
    // 1. Create Firebase Auth user (only email + password required)
    userRecord = await firebaseAuth.createUser({
      email: email.toLowerCase().trim(),
      password: initialKey,
    });

    // 2. Save to MongoDB (raw driver — no Mongoose)
    const userCollection = await getCollection("users");
    console.log("from create driver", initialKey)
    const result = await userCollection.insertOne({
      uid: userRecord.uid,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || "",
      role,
      initialKey,
      createdAt: new Date(),
    });

    // Success — return only what frontend needs
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      role,
      mongoId: result.insertedId.toString(),
    };

  } catch (error) {
    console.error("createEmployeeService error:", error.message || error);

    // Optional cleanup: delete Firebase user if MongoDB failed
    if (userRecord?.uid && !error.code?.includes("email-already-exists")) {
      try {
        await firebaseAuth.deleteUser(userRecord.uid);
        console.log("Cleaned up orphaned Firebase user:", userRecord.uid);
      } catch (cleanupError) {
        console.error("Cleanup failed:", cleanupError.message);
      }
    }

    throw error; // let controller send proper error message
  }
};



export const deleteEmployeeService = async (email) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // 1️⃣ Get Firebase user by email
    const firebaseUser = await firebaseAuth.getUserByEmail(normalizedEmail);

    // 2️⃣ Delete Firebase Auth user FIRST
    await firebaseAuth.deleteUser(firebaseUser.uid);

    // 3️⃣ Delete user profile from MongoDB
    const userCollection = await getCollection("users");
    const deleteResult = await userCollection.deleteOne({
      email: normalizedEmail,
    });

    return {
      deletedFirebaseUid: firebaseUser.uid,
      deletedFromDb: deleteResult.deletedCount === 1,
    };

  } catch (error) {
    console.error("deleteEmployeeService error:", error.message || error);
    throw error;
  }
};

export const checkAdminStatus = async (email) => {
  const query = { email };
  const userCollection = await getCollection("users");
  const user = await userCollection.findOne(query);
  console.log(user.role, "admin role")
  // Return true only if user exists and role is exactly "admin"
  return user?.role === 'superAdmin';
};

export const checkSrsUser = async (email) => {
  const query = { email };
  const userCollection = await getCollection("users");
  const user = await userCollection.findOne(query);
  const allowedRoles = ["siteManager", "payrollManager", "fleetManager", "superAdmin"];
  console.log("from userService",user?.role)
  return user != null && allowedRoles.includes(user.role);
};

export const checkDuplicateAccount = async (bankAccountNumber, excludeDriverId) => {
  if (!bankAccountNumber) {
    return ({ success: false });
  }

  const userCollection = await getCollection("users");

  const query = {
    bankAccountNumber,
    _id: { $ne: excludeDriverId } // exclude current driver
  };

  const exists = await userCollection.findOne(query);

 return({
    success: true,
    isDuplicate: !!exists,
  });
}



// not used yet
export async function verifyUser(email, password) {
  // Normally you'd fetch and compare from DB
  return { id: 1, email };
}
