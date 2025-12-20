import express from "express";
import { createWeeklyPayrunController, getWeeklyPayrunController, updateWeeklyPayrunController } from "../controllers/payrunController.js";

const router=express.Router()


//post payrun

//POST "/api/payruns/weeklyPayrun"
router.post("/weeklyPayrun",createWeeklyPayrunController)

//GET "api/payruns/weeklyPayrun"
router.get("/weeklyPayrun",getWeeklyPayrunController)

//GET "api/payruns/weeklyPayrun"
router.put("/weeklyPayrun/update",updateWeeklyPayrunController)

export default router;