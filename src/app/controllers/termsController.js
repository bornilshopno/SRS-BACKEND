// controllers/termsController.js
import { getTerms } from "../services/termsService.js";

export const fetchTerms = async (req, res) => {
  try {
    const terms = await getTerms();
    if (!terms) {
      return res.status(404).json({ message: "Terms not found" });
    }
    res.status(200).json(terms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
