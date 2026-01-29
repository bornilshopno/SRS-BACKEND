import express from "express";


import { getAllDefaults } from "../controllers/defaultsController.js";

const router = express.Router();

////api/defaults
router.get("/", getAllDefaults);


export default router;