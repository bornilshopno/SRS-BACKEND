import express from "express";
import { createAdjustmentController } from "../controllers/adjustmentController.js";
const router = express.Router();





//POST "/api/adjustments/"
router.post("/",createAdjustmentController)






export default router;