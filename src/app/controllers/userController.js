import { createUser, verifyUser } from "../services/userService.js";
import generateToken from "../../utils/generateToken.js";

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await createUser({ name, email, password });
    res.status(201).json({ message: "User registered", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
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
