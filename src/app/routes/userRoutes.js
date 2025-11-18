import express from "express";
import multer from "multer";
import { registerUser, loginUser, fetchUserByEmail, uploadUserFile, updateUserPersonalInfo, updateUserResidenceInfo, fetchAllUsers, fetchUserById, createEmployee, } from "../controllers/userController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });
//done
router.post("/register", registerUser);
// GET /api/users/:email//done
router.get("/:email", fetchUserByEmail);
// GET /api/users/:email//done
router.get("/user/:id", fetchUserById);
// POST /api/users/upload/:email
router.post("/upload/:email", upload.single("file"), uploadUserFile);
//PATCH /api/users/userPersonal/email
router.patch("/userPersonal/:email", updateUserPersonalInfo);
//PATCH /api/users/userResidence/email
router.patch("/userResidence/:email", updateUserResidenceInfo);
// GET /api/users?search=john&role=admin&fromDate=2025-01-01&toDate=2025-11-14&sortBy=submittedAt
router.get("/", fetchAllUsers);
// router.post("/create-employee", verifyAdminOrSiteManager, createEmployee);
router.post("/employees", createEmployee)
router.post("/login", loginUser);

export default router;
