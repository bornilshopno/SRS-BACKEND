import { addMatrixToDB, getAllAahMatrixData, updateMatrixService } from "../services/aahMatrixService.js";
import { logActivity } from "../services/activityService.js";


export const matrixController = async (req, res) => {
    const data = req.body;
    const { activityDoc, ...rest } = data;
    try {
        const result = await addMatrixToDB(rest)
        if (activityDoc) {
            try {
                await logActivity(activityDoc);
            } catch (logError) {
                console.error("Failed to log activity (but matrix was updated):", logError);
                // We don't fail the whole request just because logging failed
            }
        }
        return res.status(200).json(result);
    } catch (error) {
        console.error("error occuered:", new Date(), "error: ", error.message)
        return res.status(500).json({ message: error.message });
    }
}

export const allAahMatrixProvider = async (req, res) => {
    const { id, site } = req.query;
    // console.log("id from controller", id)
    try {
        const result = await getAllAahMatrixData(id, site)
        // console.log(result);
        return res.status(200).json(result)
    } catch (error) {
        console.error("error occuered in allAahMatrixrovider at:", new Date(), "error: ", error.message)
        return res.status(500).json({ message: error.message });
    }
}

export const updateOneMatrix = async (req, res) => {
    const { activityDoc, ...rest } = req.body;
    try {
        const result = await updateMatrixService(rest)
        if (activityDoc) {
            try {
                await logActivity(activityDoc);
            } catch (logError) {
                console.error("Failed to log activity (but matrix was updated):", logError);
                // We don't fail the whole request just because logging failed
            }
        }
        return res.status(200).json(result)
    } catch (error) {
        console.error("error occuered in updateOneMatrix at:", new Date(), "error: ", error.message)
        return res.status(500).json({ message: error.message });
    }
}