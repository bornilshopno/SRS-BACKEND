import { logActivity } from "../services/activityService.js";
import { createLoanService, getLoanService, updateLoanService } from "../services/loanService.js";





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

/* --------------------------------------------------
   Update LOAN
-----------------------------------------------------*/
export const updateLoanController = async (req, res) => {
  const loanId = req.params.id;
  const { update, activityDoc } = req.body;

  console.log("loanController", update, activityDoc, "ID", loanId);

  try {
    const result = await updateLoanService(loanId, update);

    // log activity AFTER successful update
    if (activityDoc) {
      try {
        await logActivity(activityDoc);
        console.log("Activity logged successfully");
      } catch (logError) {
        console.error("Failed to log activity:", logError);
      }
    }

    // single response
    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("❌ Update failed:", error);
    return res.status(500).json({ error: error.message });
  }
};