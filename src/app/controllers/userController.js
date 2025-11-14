import { createUser, findUserByEmail, getAllUsers, getUserByEmail, getUserById, updateUserPersonalService, updateUserResidenceService, uploadFileAndSaveToUser, verifyUser } from "../services/userService.js";
import generateToken from "../../utils/generateToken.js";



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
const fileKey=req.body.docKey 
console.log("from Controller fileKey",fileKey)
    const result = await uploadFileAndSaveToUser(filePath,fileKey, email);

    res.status(200).json({
      message: "File uploaded and saved successfully",
      url: result.url,
    });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    res.status(500).json({ error: error.message });
  }
}


export const updateUserPersonalInfo = async (req, res) => {
  try {
    const email = req.params.email;
    const updatedDoc = req.body;
    console.log("Controller", updatedDoc)
    const result = await updateUserPersonalService(email, updatedDoc);

    res.status(200).send(result);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send({ message: "Failed to update user", error });
  }
};


export const updateUserResidenceInfo=async(req,res)=>{
try {
  const email=req.params.email;
  const updatedDoc=req.body;
  const result=await updateUserResidenceService(email,updatedDoc)
} catch (error) {
      console.error("Error updating user:", error);
    res.status(500).send({ message: "Failed to update user", error });
}

}
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
