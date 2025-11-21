import { createUser, findUserByEmail, getAllUsers, getUserByEmail, getUserById, updateUserPersonalService, updateUserResidenceService, uploadFileAndSaveToUser, verifyUser } from "../services/userService.js";
import generateToken from "../../utils/generateToken.js";
import { createEmployeeService } from "../services/userService.js";
import { logActivity } from "../services/activityService.js";


//check done
export const registerUser = async (req, res) => {
  try {
    const user = req.body;
    const existingUser = await findUserByEmail(user.email);
    console.log(existingUser)
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

//check done
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
    console.log("id", id)
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

// getAllUsers
export const fetchAllUsers = async (req, res) => {
  try {
    const { search = "", sortBy, role, fromDate, toDate } = req.query;
    console.log("reached controller", "role", role)
    const users = await getAllUsers({ search, sortBy, role, fromDate, toDate });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export async function uploadUserFile(req, res) {
  try {
    console.log(req.file)
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


// export const updateUserPersonalInfo = async (req, res) => {
//   try {
//     const email = req.params.email;
//     const updatedDoc = req.body;
//     console.log("Controller", updatedDoc)
//     const result = await updateUserPersonalService(email, updatedDoc);

//     res.status(200).send(result);
//   } catch (error) {
//     console.error("Error updating user:", error);
//     res.status(500).send({ message: "Failed to update user", error });
//   }
// };

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
        console.log("Activity logged successfully");
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
  const { name, email, initialKey, phone, role } = req.body;
  // console.log( "from createEmployee", req.body) 
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
    console.error("Create employee error:", error.message || error);

    if (error.code?.startsWith("auth/")) {
      const msg =
        error.code === "auth/email-already-exists"
          ? "This email is already registered"
          : error.code === "auth/invalid-email"
            ? "Invalid email address"
            : "Password too weak or Firebase error";

      return res.status(400).json({ success: false, message: msg });
    }

    return res.status(500).json({
      success: false,
      message: "Server error — please try again",
    });
  }
};






//not checked

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await verifyUser(email, password);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);

    // Store JWT in cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
