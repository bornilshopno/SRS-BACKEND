import express from "express";
import multer from "multer";
import { registerUser, loginUser, fetchUserByEmail, uploadUserFile, updateUserPersonalInfo, updateUserResidenceInfo } from "../controllers/userController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });
//done
router.post("/register", registerUser);
// GET /api/users/:email//done
router.get("/:email", fetchUserByEmail);
// POST /api/users/upload/:email
router.post("/upload/:email", upload.single("file"), uploadUserFile);
//PATCH /api/users/userPersonal/email
router.patch("/userPersonal/:email", updateUserPersonalInfo);
//PATCH /api/users/userResidence/email
router.patch("/userResidence/:email", updateUserResidenceInfo);

router.post("/login", loginUser);

export default router;
