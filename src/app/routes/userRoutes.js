import express from "express";
import { registerUser, loginUser, fetchUserByEmail } from "../controllers/userController.js";

const router = express.Router();
//done
router.post("/register", registerUser);
// GET /api/users/:email//done
router.get("/:email", fetchUserByEmail);


router.post("/login", loginUser);

export default router;
