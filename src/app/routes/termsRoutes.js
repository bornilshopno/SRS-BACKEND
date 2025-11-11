
// routes/termsRoutes.js
import express from "express";
import { fetchTerms } from "../controllers/termsController.js";

const router = express.Router();

router.get("/", fetchTerms);

export default router;
