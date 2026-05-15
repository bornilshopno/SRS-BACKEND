import express from "express";
import { loginUser, logoutUser, refreshAccessToken, testingFn } from "../controllers/authController.js";
import { verifyAdmin } from "../../middleware/roles.js";

const router=express.Router()

//default gateway=> '/auths'
router.get("/test",verifyAdmin, testingFn);
router.post("/setup", loginUser);
router.post("/logout", logoutUser);
router.post("/refresh-token",refreshAccessToken )

export default router;