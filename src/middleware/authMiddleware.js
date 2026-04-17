import jwt from "jsonwebtoken";
import { getCollection } from "../utils/getCollection.js";

export const verifyToken = (req, res, next) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: "Not authorized, no token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalid or expired" });
  }
};

