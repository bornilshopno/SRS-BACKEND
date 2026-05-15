import { addIncidentToDB, getAllIncidents, getIncidentsLastSixMonths } from "../services/incidentServices.js";


// export const createIncident = async (req, res) => {
//     const data = req.body;
//     try {
//         const result = await addIncidentToDB(data)
//         return res.status(200).json(result);
//     } catch (error) {
//         console.error("error occuered:", new Date(), "error: ", error.message)
//         return res.status(500).json({ message: error.message });
//     }
// }

export const createIncident = async (req, res) => {
    try {
        const data = req.body;
        const files = req.files;

        // fileTitles comes from frontend
        let { fileTitles } = data;

        // normalize (because single vs multiple)
        if (!Array.isArray(fileTitles)) {
            fileTitles = fileTitles ? [fileTitles] : [];
        }

        const attachments = files?.map((file, index) => ({
            title: fileTitles[index] || "Untitled",
            filePath: `/fileUploads/${file.filename}`
        })) || [];

        const finalData = {
            ...data,
            attachments
        };

        const { activityDoc, ...rest } = finalData;

        const result = await addIncidentToDB(rest);
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
        console.error("error occuered:", new Date(), "error: ", error.message);
        return res.status(500).json({ message: error.message });
    }
};

export const allIncidentsProvider = async (req, res) => {
    try {
        const result = await getAllIncidents()
        return res.status(200).json(result)
    } catch (error) {
        console.error("error occuered in allIncidentProvider at:", new Date(), "error: ", error.message)
        return res.status(500).json({ message: error.message });
    }
}

export const provideLastSixMonthsIncidents = async (req, res) => {

    try {
        const { fromDate, toDate } = req.query
        const result = await getIncidentsLastSixMonths(fromDate, toDate)
        return res.status(200).json(result)
    } catch (error) {
        console.error("error occuered in provideLastSixMonthsIncidents at:", new Date(), "error: ", error.message)
        return res.status(500).json({ message: error.message });
    }





}