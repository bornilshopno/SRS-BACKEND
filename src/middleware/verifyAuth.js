import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getCollection } from "../utils/getCollection.js";

/**
 * router.get("/profile", verifyJWT, getProfile);
 * router.get("/admin", verifyAdmin, adminController);
 * router.get("/driver", verifyDriver, driverController);
 **/
const verifyAuth = (allowedRoles = []) => {
    return async (req, res, next) => {
        try {
            // ✅ 1. Get token from cookie
            const token = req.cookies?.accessToken;
            // console.log("Received Token")

            if (!token) {
                return res.status(401).json({ message: "Unauthorized: No token" });
            }

            // ✅ 2. Verify JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // console.log("verifyAuth decoded req from email :", decoded.email)
            // decoded: { id, email, role }

            // ✅ 3. Fetch user from DB (IMPORTANT)
            const userCollection = await getCollection("users");

            const user = await userCollection.findOne({
                _id: new ObjectId(decoded.id),
            });

            console.log("verifyAuth-User Found :", user.role)

            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            // ✅ 4. Role check (if roles provided)
            if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                return res.status(403).json({
                    message: "Forbidden: insufficient permissions",
                });
            }

            // ✅ 5. Attach user to request
            req.user = {
                id: user._id,
                email: user.email,
                role: user.role,
            };

            next();
        } catch (error) {
            console.error("Auth error:", error.message);

            return res.status(401).json({
                message: "Invalid or expired token",
            });
        }
    };
};

export default verifyAuth;