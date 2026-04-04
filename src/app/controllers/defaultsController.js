import { addSiteService, checkSiteService, editSiteService, getDefaultsService } from "../services/defaultService.js";


export const getAllDefaults = async (req, res) => {
  try {
    const defaults = await getDefaultsService();

    return res.status(200).json({
      success: true,
      data: defaults
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkDuplicateSite = async (req, res) => {
  try {
    const newValue = req.query.newValue
    const newLabel = req.query.newLabel

    const result = await checkSiteService(newLabel, "newValue")
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export const addSiteToDefaults = async (req, res) => {
  try {
    const newSite = req.body
    const result = await addSiteService(newSite)
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export const editExistingSite=async(req,res)=>{
    try {
    const updatedSite = req.body
    const result = await editSiteService(updatedSite)
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}