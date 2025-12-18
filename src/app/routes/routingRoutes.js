// routingRoutes.js
import express from "express";
import {
  createWeek,
  getWeek,
  updateSite,
  copyWeek,
  copySiteOnlyController,
  siteSubmitController
} from "../controllers/routingController.js";

const router = express.Router();


// --------------------------------------------------
// CREATE week OR add site inside existing week
// POST /api/routings
// --------------------------------------------------
router.post("/", createWeek);


// --------------------------------------------------
// GET week (all sites)
// GET /api/routings?year=2025&week=4
// --------------------------------------------------
router.get("/", getWeek);


// --------------------------------------------------
// UPDATE specific site inside week
// PUT /api/routings/:year/:week/:site
// --------------------------------------------------
router.put("/:year/:week/:site", updateSite);


// --------------------------------------------------
// COPY WEEK
// POST /api/routings/copy
// --------------------------------------------------
router.post("/copy", copyWeek);


// copy only one site's allocations
router.post("/copy-site", copySiteOnlyController);

router.patch("/submit/:year/:week/:site", siteSubmitController )

export default router;
