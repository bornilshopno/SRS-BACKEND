import { createWeeklyPayrunService, getWeeklyPayrunService, updateWeeklyPayrunService } from "../services/payrunService.js"



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
        const { year, week} = req.query;
   

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

export const updateWeeklyPayrunController= async(req,res)=> {

    try {
        console.log("body payrun", req.body)
        const result = await updateWeeklyPayrunService(req.body)
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }



}