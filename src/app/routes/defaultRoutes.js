import express from "express";


import { addSiteToDefaults, checkDuplicateSite,  deleteSite,  editExistingSite, getAllDefaults, siteUsageController } from "../controllers/defaultsController.js";

const router = express.Router();

////api/defaults
router.get("/", getAllDefaults);
////api/defaults/check-duplicate-site
router.get("/check-duplicate-site",checkDuplicateSite)
////api/defaults/add-Site
router.patch("/add-Site", addSiteToDefaults)
////api/defaults/edit-Site
router.patch("/edit-Site", editExistingSite)
////api/defaults/edit-Site
router.patch("/delete-Site", deleteSite)
//api/defaults/site/checkusuage?site="value"
router.get("/site/check-usuage", siteUsageController)

export default router;