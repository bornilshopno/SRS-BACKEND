// routes/termsRoutes.js
import express from "express";
import { fetchActivities, fetchActivitiesByUser } from "../controllers/activityController.js";

const router = express.Router();

///api/activity/profileChanges
router.get("/profileChanges", fetchActivities);
///api/activity/user/:id
router.get("/user/:id", fetchActivitiesByUser);

export default router;