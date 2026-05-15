import express from 'express'
import { allAahMatrixProvider, matrixController, updateOneMatrix } from '../controllers/aahMatrixController.js'


const router=express.Router()


//POST "/aah-matrix/add"
router.post("/add", matrixController)
//GET "/aah-matrix/all"
router.get("/all/", allAahMatrixProvider)
//PUT "/aah-matrix/:id"
router.put("/update", updateOneMatrix)

export default router