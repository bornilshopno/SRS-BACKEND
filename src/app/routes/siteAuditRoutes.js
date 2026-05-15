import express from 'express'
import { allAuditReportProvider, createAuditReport, updateAuditResults } from '../controllers/siteAuditController.js'


const router=express.Router()

//deafults "/site-audits"

//POST "/aah-matrix/add"
router.post("/add", createAuditReport)
//GET "/aah-matrix/all"
router.get("/all/", allAuditReportProvider)
//PUT "/aah-matrix/:id"
router.put("/update", updateAuditResults)

export default router