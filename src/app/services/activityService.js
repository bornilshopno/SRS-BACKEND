import { ObjectId } from "mongodb";
import { getCollection } from "../../utils/getCollection.js";

export async function logActivity(data) {
    const activityCollection = await getCollection("activities");

    const payload = {
        ...data,
        updatedBy: new ObjectId(data.updatedBy),  // ← force ObjectId
        updatedAt: Date.now(),
        userUpdated: new ObjectId(data.userUpdated)
    };

    console.log("payload", payload)

    const result = await activityCollection.insertOne(payload);
    return result;
}


export const getActivities = async (req, res) => {
    try {
        const activities = await getCollection("activities");

        const result = await activities.aggregate([
            {
                $lookup: {
                    from: "users",                    // ← your users collection name
                    localField: "updatedBy",          // field in activities
                    foreignField: "_id",              // field in users
                    as: "updatedByUser"               // new array field
                }
            },
                  { $unwind: { path: "$updatedByUser", preserveNullAndEmptyArrays: true } },
            //correct before 
            {
                $lookup: {
                    from: "users",
                    localField: "userUpdated",
                    foreignField: "_id",
                    as: "updatedUserData"

                }
            },
      { $unwind: { path: "$updatedUserData", preserveNullAndEmptyArrays: true } },

            // Project data from foreign
            {
                $project: {
                    update: 1,
                    updatedAt: 1,
                    "updatedUserData.name": 1,
                    "updatedUserData.email": 1,
                    "updatedUserData.role": 1,

                    "updatedByUser.name": 1,
                    "updatedByUser.email": 1,
                    "updatedByUser.role": 1,

                }
            },
            { $sort: { updatedAt: -1 } } // optional: newest first
        ]).toArray();
        // console.log(result)

        return result


    } catch (error) {
        console.error("Error fetching activities:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};