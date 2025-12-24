import { createLoanService, getLoanService } from "../services/loanService.js";





/* --------------------------------------------------
   CREATE LOAN
-----------------------------------------------------*/
export const createLoanController = async (req, res) => {
    try {
        console.log("body loan", req.body)
        const result = await createLoanService(req.body)
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


/* --------------------------------------------------
   GET LOAN
-----------------------------------------------------*/
export const getLoanController = async (req, res) => {
    const id = req.query.id;
    try {
        console.log("body loan", req.body)
        const result = await getLoanService(id)
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}