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

    // console.log("payload", payload)

    const result = await activityCollection.insertOne(payload);
    return result;
}

export const getActivities = async (site, fromDate, toDate) => {
    try {
        const activities = await getCollection("activities");

        const result = await activities.aggregate([
            {
                $match: {
                    
                    $or: [
                        // keep all where userUpdated !== updatedBy
                        { $expr: { $ne: ["$userUpdated", "$updatedBy"] } },

                        // OR keep exceptions even if equal
                        {
                            update: {
                                $in: [
                                    "Driving Application Received",
                                    "Manager Profile Updated"
                                ]
                            }
                        }
                    ]
                }
            },
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
                    changedFields: 1,
                    "updatedUserData.name": 1,
                    "updatedUserData.email": 1,
                    "updatedUserData.srsDriverNumber": 1,
                    "updatedUserData.site": 1,

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


export const getActivitiesRevised = async (
    site,
    fromDate,
    toDate
) => {

    try {

        const activities = await getCollection(
            "activities"
        );

        // Dynamic match object
        const matchQuery = {
            $or: [
                // keep all where userUpdated !== updatedBy
                {
                    $expr: {
                        $ne: [
                            "$userUpdated",
                            "$updatedBy"
                        ]
                    }
                },

                // OR keep exceptions even if equal
                {
                    update: {
                        $in: [
                            "Driving Application Received",
                            "Manager Profile Updated"
                        ]
                    }
                }
            ]
        };

        // Date filtering
        if (fromDate && toDate) {

            matchQuery.updatedAt = {};

            if (fromDate) {
                const startDate= new Date(fromDate)
                startDate.setHours(0,0,0,1)
                matchQuery.updatedAt.$gte =
                    new Date(startDate).getTime();
            }

            if (toDate) {

                // include full end date
                const endDate = new Date(toDate);
                endDate.setHours(23, 59, 59, 999);

                matchQuery.updatedAt.$lte =
                    endDate.getTime();
            }
        }

        const pipeline = [

            {
                $match: matchQuery
            },

            {
                $lookup: {
                    from: "users",
                    localField: "updatedBy",
                    foreignField: "_id",
                    as: "updatedByUser"
                }
            },

            {
                $unwind: {
                    path: "$updatedByUser",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $lookup: {
                    from: "users",
                    localField: "userUpdated",
                    foreignField: "_id",
                    as: "updatedUserData"
                }
            },

            {
                $unwind: {
                    path: "$updatedUserData",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Site filtering
            ...(site && site !== "all"
                ? [
                    {
                        $match: {
                            "updatedUserData.site": site
                        }
                    }
                ]
                : []),

            {
                $project: {
                    update: 1,
                    updatedAt: 1,
                    changedFields: 1,

                    "updatedUserData.name": 1,
                    "updatedUserData.email": 1,
                    "updatedUserData.srsDriverNumber": 1,
                    "updatedUserData.site": 1,

                    "updatedByUser.name": 1,
                    "updatedByUser.email": 1,
                    "updatedByUser.role": 1,
                }
            },

            {
                $sort: {
                    updatedAt: -1
                }
            }
        ];

        const result = await activities
            .aggregate(pipeline)
            .toArray();

        return result;

    } catch (error) {

        console.error(
            "Error fetching activities:",
            error
        );

        throw error;
    }
};

export const getActivitiesByUser = async (userId) => {
    if (!userId) {
        throw new Error("User ID is required");
    }

    const activities = await getCollection("activities");

    const result = await activities.aggregate([
        {
            $match: {
                userUpdated: new ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "updatedBy",
                foreignField: "_id",
                as: "updatedByUser"
            }
        },
        {
            $unwind: {
                path: "$updatedByUser",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                update: 1,
                updatedAt: 1,
                userUpdated: 1,           // keeps the original userUpdated ID
                changedFields: 1,
                "updatedByUser.name": 1,
                "updatedByUser.email": 1,
                "updatedByUser.role": 1,
            }
        },
        {
            $sort: { updatedAt: -1 }
        }
    ]).toArray();

    return result;
};