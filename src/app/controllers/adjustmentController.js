import { createAdjustment } from "../services/adjustmentService.js";



/* --------------------------------------------------
   CREATE Adjustment
-----------------------------------------------------*/
export const createAdjustmentController = async (req, res) => {
    try {
        console.log("body penalty", req.body)
        const result = await createAdjustment(req.body)
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}