import { logActivity } from "../services/activityService.js"
import { createWeeklyPayrunService, getWeeklyPayrunService, updateHoldStatus, updateWeeklyPayrunService } from "../services/payrunService.js"



/* --------------------------------------------------
   CREATE or UPDATE Weekly Payrun
-----------------------------------------------------*/
export const createWeeklyPayrunController = async (req, res) => {
    console.log("payrun received")
    try {
        console.log("body payrun", req.body)
        const result = await createWeeklyPayrunService(req.body)
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

/* --------------------------------------------------
   GET Weekly Payrun
-----------------------------------------------------*/

export const getWeeklyPayrunController = async (req, res) => {

    try {
        const { year, week } = req.query;


        const doc = await getWeeklyPayrunService(year, week);

        // Just return whatever getWeekService returns
        // → null if week doesn't exist
        // → full doc if no site param
        // → site-specific object if site is provided
        return res.status(200).json(doc);  // Always 200

    } catch (err) {
        console.error('getWeeklyPayrun error:', err);
        return res.status(500).json({ message: "Server error" });
    }

}

/* --------------------------------------------------
   Update Weekly Payrun
-----------------------------------------------------*/

export const updateWeeklyPayrunController = async (req, res) => {

    try {
        // console.log("body payrun", req.body)

        const { activityDoc, ...payrunData } = req.body;
        const result = await updateWeeklyPayrunService(payrunData)
           // Step 2: ONLY log activity if update was successful AND activityDoc exists
        if (activityDoc) {
            try {
                await logActivity(activityDoc);
                console.log("Activity logged successfully");
            } catch (logError) {
                console.error("Failed to log activity (but user was updated):", logError);
                // We don't fail the whole request just because logging failed
            }
        }
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

/* --------------------------------------------------
   Update Hold Status DriverWise
-----------------------------------------------------*/

export const controlHoldStatus = async (req, res) => {

    try {
        const { activityDoc, ...holdDoc } = req.body
        const result = await updateHoldStatus(holdDoc)


        // Step 2: ONLY log activity if update was successful AND activityDoc exists
        if (activityDoc) {
            try {
                await logActivity(activityDoc);
                console.log("Activity logged successfully");
            } catch (logError) {
                console.error("Failed to log activity (but user was updated):", logError);
                // We don't fail the whole request just because logging failed
            }
        }
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}