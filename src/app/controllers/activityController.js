import { getActivities, getActivitiesByUser, getActivitiesRevised } from "../services/activityService.js";



export const fetchActivities = async (req, res) => {
  console.log("reaced")
  try {
    const { site, fromDate, toDate } = req.query;

    console.log(req.query)
    const activities = await getActivitiesRevised(site, fromDate, toDate);
    if (!activities) {
      return res.status(404).json({ message: "Activities not found" });
    }

    console.log("activitis", activities)

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
  const id = req.params.id
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