import express from "express";
import { createWeeklyPayrunController, getWeeklyPayrunController, updateWeeklyPayrunController } from "../controllers/payrunController.js";
import { payrunPreview } from "../controllers/payrunPreview.js";
import { payrunBefore } from "../controllers/payrunBefore.js";
import { payrunPreviewFinal } from "../controllers/payrunPreviewFinal.js";

const router=express.Router()


//post payrun

//POST "/api/payruns/weeklyPayrun"
router.post("/weeklyPayrun",createWeeklyPayrunController)

//GET "api/payruns/weeklyPayrun"
router.get("/weeklyPayrun",getWeeklyPayrunController)

//GET "api/payruns/weeklyPayrun"
router.put("/weeklyPayrun/update",updateWeeklyPayrunController)

router.post("/preview", payrunPreviewFinal);
// router.post("/before", payrunBefore);


export default router;