import { addAuditDataToDB, getAllAuditData, updateSingleAuditReport } from "../services/siteAuditServices.js";


export const createAuditReport = async (req, res) => {
    const { activityDoc, ...data } = req.body;
    try {
        const result = await addAuditDataToDB(data)
        if (activityDoc) {
            try {
                await logActivity(activityDoc);
            } catch (logError) {
                console.error("Failed to log activity (compliants incident):", logError);
                // We don't fail the whole request just because logging failed
            }
        }
        return res.status(200).json(result);
    } catch (error) {
        console.error("error occuered:", new Date(), "error: ", error.message)
        return res.status(500).json({ message: error.message });
    }
}

export const allAuditReportProvider = async (req, res) => {
    const { id, site } = req.query;
    // console.log("id from controller", id)
    try {
        const result = await getAllAuditData(id, site)
        // console.log(result);
        return res.status(200).json(result)
    } catch (error) {
        console.error("error occuered in allAahMatrixrovider at:", new Date(), "error: ", error.message)
        return res.status(500).json({ message: error.message });
    }
}

export const updateAuditResults = async (req, res) => {
    const { activityDoc, ...data } = req.body;
    try {
        const result = await updateSingleAuditReport(data)
        if (activityDoc) {
            try {
                await logActivity(activityDoc);
            } catch (logError) {
                console.error("Failed to log activity (compliants incident):", logError);
                // We don't fail the whole request just because logging failed
            }
        }
        return res.status(200).json(result)
    } catch (error) {
        console.error("error occuered in updateOneMatrix at:", new Date(), "error: ", error.message)
        return res.status(500).json({ message: error.message });
    }
}