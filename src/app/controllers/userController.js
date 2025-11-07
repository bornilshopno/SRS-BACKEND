import { createUser, findUserByEmail, verifyUser } from "../services/userService.js";
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

import { getUserByEmail } from "../services/userService.js";
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
