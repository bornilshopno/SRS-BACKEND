// routes/termsRoutes.js
import express from "express";

import { fetchActivities } from "../controllers/activityController.js";

const router = express.Router();

///api/activity/profileChanges
router.get("/profileChanges", fetchActivities);
// router.post("/profileChanges", fetchTerms);

export default router;