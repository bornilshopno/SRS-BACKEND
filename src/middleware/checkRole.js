// app/middleware/checkRole.js
import { getDb } from "../config/db.js"; // your db connection

const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const db = getDb(); // your connected db instance
      const userId = req.user; // comes from protect middleware (MongoDB _id as string)

      const user = await db.collection("users").findOne(
        { _id: userId },
        { projection: { role: 1, uid: 1, email: 1 } }
      );

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res
          .status(403)
          .json({ message: "Access denied: Only superAdmin/siteManager allowed" });
      }

      // Attach useful info for controller
      req.authUser = {
        id: user._id.toString(),
        uid: user.uid || null,
        role: user.role,
        email: user.email,
      };

      next();
    } catch (error) {
      console.error("checkRole error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  };
};

export default checkRole;