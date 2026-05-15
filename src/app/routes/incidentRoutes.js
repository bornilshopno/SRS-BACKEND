import express from 'express'
import { allIncidentsProvider, createIncident, provideLastSixMonthsIncidents } from '../controllers/incidentController.js'
import { fileUpload } from '../../utils/multerSetUp.js'

const router = express.Router()

//POST "/incidents/add"
router.post(
    "/add",
    fileUpload.array("files"), // 👈 IMPORTANT
    createIncident
)

//GET "/incidents/all"
router.get("/all", allIncidentsProvider)

router.get("/six-months",provideLastSixMonthsIncidents)


export default router;