import express from "express";
import { createWeeklyPayrunController, getWeeklyPayrunController } from "../controllers/payrunController.js";

const router=express.Router()


//post payrun

//POST "/api/payruns/weeklyPayrun"
router.post("/weeklyPayrun",createWeeklyPayrunController)

//GET "api/payruns/weeklyPayrun"
router.get("/weeklyPayrun",getWeeklyPayrunController)

export default router;