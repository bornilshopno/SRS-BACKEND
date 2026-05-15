import { checkAdminStatus, checkAndSendResetMail, checkDuplicateAccount, checkDuplicateField, checkSrsUser, createUser, deleteEmployeeService, deleteFromOtherDocuments, deleteFromRecycleBin, fileRecycleService, findUserByEmail, getAllUsers, getUserByEmail, getUserById, restoreFromRecycleBin, saveFileUrlToUser, updateUserPersonalService, updateUserResidenceService, uploadFileAndSaveToUser, } from "../services/userService.js";
import { createEmployeeService } from "../services/userService.js";
import { logActivity } from "../services/activityService.js";
import { userFileDeleteService } from "../services/fileService/fileService.js";



export const registerUser = async (req, res) => {
  try {
    const user = req.body;
    const existingUser = await findUserByEmail(user.email);
    // console.log(existingUser)
    if (existingUser) {
      return res.status(200).json({
        message: "Previously Registered User",
        insertedId: null,
      });
    }

    const result = await createUser(user);
    res.status(201).json({
      message: "User registered successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("❌ Register user failed:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
};


export const fetchUserByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const fetchUserById = async (req, res) => {
  try {
    const id = req.params.id;
    // console.log("id", id)
    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const fetchAllUsers = async (req, res) => {
  try {
    const { search = "", sortBy, role, fromDate, toDate } = req.query;
    // console.log("reached controller", "role", role)
    const users = await getAllUsers({ search, sortBy, role, fromDate, toDate });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export async function uploadUserFile(req, res) {
  try {
    // console.log(req.file)
    const email = req.params.email;
    const filePath = req.file.path;
    const fileKey = req.body.docKey
    console.log("from Controller fileKey", fileKey)
    const result = await uploadFileAndSaveToUser(filePath, fileKey, email);

    res.status(200).json({
      message: "File uploaded and saved successfully",
      url: result.url,
    });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    res.status(500).json({ error: error.message });
  }
}


export async function uploadFile(req, res) {
  try {
    const id = req.params.id;
    const fileKey = req.body.docKey;

    // ✅ safely parse activityDoc
    let activityDoc = null;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // const fileUrl = `${req.protocol}://${req.get("host")}/api/uploads/${req.file.filename}`;
    // const fileUrl = `/fileUploads/${req.file.filename}`;

//temporary ❌❌❌❌❌❌
    const fileUrl = `/fileUploads/${id}/${req.file.filename}`;

    const result = await saveFileUrlToUser(fileUrl, fileKey, id);


    if (result?.updated) {
      if (req.body.activityDoc) {
        try {
          activityDoc = JSON.parse(req.body.activityDoc);
          const result = await logActivity(activityDoc);
        } catch (err) {
          return res.status(400).json({ error: "Invalid activityDoc JSON" });
        }
      }
    }

    res.status(200).json({
      message: "File uploaded successfully",
      url: fileUrl,
    });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    res.status(500).json({ error: error.message });
  }
}


export const updateUserPersonalInfo = async (req, res) => {
  try {
    const { email } = req.params; // cleaner than req.params.email
    const reqBody = req.body;

    // Separate activity log from actual user data
    const { activityDoc, ...updatedDoc } = reqBody;


    // Step 1: Update the user's personal info in the database
    const result = await updateUserPersonalService(email, updatedDoc);

    // If nothing was updated (e.g. user not found or no changes)
    if (!result || result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found or no changes detected",
      });
    }

    if (result.modifiedCount === 0) {
      return res.status(200).json({
        success: true,
        message: "No changes made (data already up to date)",
        data: result,
      });
    }

    // Step 2: ONLY log activity if update was successful AND activityDoc exists
    if (activityDoc) {
      try {

        await logActivity(activityDoc);
        // console.log("Activity logged successfully");
      } catch (logError) {
        console.error("Failed to log activity (but user was updated):", logError);
        // We don't fail the whole request just because logging failed
      }
    }

    // Step 3: Final success response
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: result,
    });

  } catch (error) {
    console.error("Error in updateUserPersonalInfo:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


export const updateUserResidenceInfo = async (req, res) => {
  try {
    const email = req.params.email;
    const updatedDoc = req.body;
    const result = await updateUserResidenceService(email, updatedDoc)
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send({ message: "Failed to update user", error });
  }

}

// app/controllers/userController.js//woriking tested 18/11
export const createEmployee = async (req, res) => {
  const { name, email, initialKey, phone, role, site } = req.body;
  // console.log("from createEmployee", req.body)
  // Validation
  if (!email || !initialKey || !role) {
    return res.status(400).json({
      success: false,
      message: "Email, initial password, and role are required",
    });
  }

  if (initialKey.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Initial password must be at least 6 characters",
    });
  }



  try {
    const result = await createEmployeeService({
      name: name.trim() || "",
      email: email.toLowerCase().trim(),
      initialKey,
      phone: phone?.trim() || "",
      role,
      site,
    });

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: {
        uid: result.uid,
        email: result.email,
        role: result.role,
      },
    });
  } catch (error) {


    if (error.code?.startsWith("auth/")) {
      const msg =
        error.code === "auth/email-already-exists"
          ? "This email is already registered"
          : error.code === "auth/invalid-email"
            ? "Invalid email address"
            : "Password too weak or Firebase error";

      return res.status(400).json({ success: false, message: msg || error.message });
    }

    if (error.message === "email-already-registered-user") {
      return res.status(400).json({ success: false, message: "This email is already registered" });
    }
    console.error("Create employee error:", error.message || error,"While registering :",email, "at :", new Date());
    return res.status(500).json({
      success: false,
      message: "Server error — please try again",
    });
  }
};


export const deleteEmployee = async (req, res) => {
  // console.log("DELETE", req.params)
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const result = await deleteEmployeeService(email);

    res.status(200).json({
      success: true,
      message: "User deleted from Firebase and database",
      ...result,
    });

  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return res.status(404).json({
        message: "User not found in Firebase",
      });
    }

    res.status(500).json({
      message: "Failed to delete user",
      error: error.message,
    });
  }
};


export const isAdmin = async (req, res) => {
  try {
    const email = req.params.email;

    const admin = await checkAdminStatus(email);

    console.log({ admin });
    res.send({ admin });
  } catch (error) {
    console.error('Error in isAdmin controller:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
};
export const isSrsUser = async (req, res) => {
  try {
    const email = req.params.email;
    const srs = await checkSrsUser(email);
    res.send({ srs });
  } catch (error) {
    console.error('Error in isAdmin controller:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
};


export const checkDuplicateAccountController = async (req, res) => {
  console.log("checking")
  try {
    const { bankAccountNumber, excludeDriverId } = req.query;
    const result = await checkDuplicateAccount(bankAccountNumber, excludeDriverId)
    res.status(200).send(result)
  } catch (error) {
    console.error('Error in checking accoung:', error);
    res.status(500).send({ error: { message: 'Internal check error' } });
  }
}
export const commonDuplicateFieldCheckController = async (req, res) => {
  try {
    const { field, value, excludeId } = req.query;

    const result = await checkDuplicateField(field, value, excludeId);

    res.status(200).send(result);
  } catch (error) {
    console.error("Duplicate check error:", error);
    res.status(500).send({ error: { message: "Internal check error" } });
  }
};


export const fileRecycleController = async (req, res) => {
  const { docKey, file, isOtherDocuments, activityDoc } = req.body
  const id = req.params.id

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "DriverId not found",
    });
  }
  //Direct deletion for other documents
  if (isOtherDocuments) {
    const deleteOperation = await userFileDeleteService(file)
    const userUpdate = await deleteFromOtherDocuments(id, docKey, file)

    if (userUpdate?.modifiedCount > 0) {
      if (activityDoc) {
        await logActivity(activityDoc)
      }
      return res.status(200).json({
        success: true,
        message: "File deleted from other documents",
      });
    }
    else {
      return res.status(200).json({
        success: false,
        message: "File deleted but user not updated accordingly",
      });
    }
  }
  //send to recycle bin
  else {
    const controller = await fileRecycleService(id, docKey, file)
    if (controller?.modifiedCount > 0) {
      if (activityDoc) {
        await logActivity(activityDoc)
      }
      return res.status(200).json({
        success: true,
        message: "File deleted and updated user successfully",
      });
    }
    else {
      return res.status(200).json({
        success: false,
        message: "File deleted but user not updated accordingly",
      });
    }
  }
}

export const updateRecyleFile = async (req, res) => {
  const { docId, docKey, file, action, activityDoc } = req.body
  const userId = req.params.id

  if (action === 'RESTORE') {
    const result = await restoreFromRecycleBin(userId, docId, docKey, file)
    if (result?.modifiedCount > 0) {
      if (activityDoc) {
        await logActivity(activityDoc)
      }
      return res.status(200).json({
        success: true,
        message: "File restored from recycle bin",
      });
    }
    else {
      return res.status(200).json({
        success: false,
        message: "File not found in recycle bin",
      });
    }
  }

  if (action === "DELETE") {
    const deleteOperation = await userFileDeleteService(file)
    const updateUserRes = await deleteFromRecycleBin(userId, docId)
    if (updateUserRes?.modifiedCount > 0) {
      if (activityDoc) {
        await logActivity(activityDoc)
      }
      return res.status(200).json({
        success: true,
        message: "File deleted from recycle bin",
      });
    }
    else {
      return res.status(200).json({
        success: false,
        message: "File not found in recycle bin",
      });
    }
  }
}

export const checkResetOption = async (req, res) => {
  try {
    const email = req.body.email;
    const result = await checkAndSendResetMail(email);
    return res.status(200).json(result)
  } catch (error) {
    console.error('Error check reset option:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
};

