// backend/middleware/verifyAdminOrSiteManager.js
import admin from "firebase-admin";

const verifyAdminOrSiteManager = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);

    // Custom claims are under decodedToken.role (because we set { role })
    const role = decodedToken.role;

    if (!role || !["superAdmin", "siteManager"].includes(role)) {
      return res.status(403).json({ message: "Access denied: Super Admin or Site Manager only" });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || decodedToken.email_verified,
      role,
    };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default verifyAdminOrSiteManager;