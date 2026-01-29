import { getDefaultsService } from "../services/defaultService.js";


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