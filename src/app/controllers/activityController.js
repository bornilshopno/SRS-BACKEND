import { getActivities, getActivitiesByUser } from "../services/activityService.js";



export const fetchActivities = async (req, res) => {
  try {
    const activities = await getActivities();
    if (!activities) {
      return res.status(404).json({ message: "Activities not found" });
    }
    
return res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const fetchActivitiesByUser = async (req, res) => {
  const id=req.params.id
  try {
    const activities = await getActivitiesByUser(id);
    if (!activities) {
      return res.status(404).json({ message: "Activities not found" });
    }

    return res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};