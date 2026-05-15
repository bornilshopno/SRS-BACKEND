import { getCollection } from "../../utils/getCollection.js"
import { getNextSequence } from "../../utils/getSequence.js"


export const addIncidentToDB = async (data) => {
    const collection = await getCollection("incidents")
    const seq = await getNextSequence("incidentNumber");

    // ❗ optional cleanup
    delete data.fileTitles;

    const dataToInsert = {
        ...data, incidentTime: Number(data.incidentTime),
        incidentNumber: `IN${seq}`, //IN1 , IN2, IN3
        enteredAt: Date.now(),
    }

    const result = await collection.insertOne(dataToInsert)
    return result
}

export const getAllIncidents = async () => {
    try {
        const collection = await getCollection("incidents")
        const result = await collection.aggregate([
            {
                $lookup: {
                    from: "users",
                    let: { driverId: { $toObjectId: "$driverId" } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$driverId"] }
                            }
                        },
                        {
                            $project: {
                                name: 1,
                                srsDriverNumber: 1,
                                email: 1,
                                site: 1,
                                profileImage: 1,
                            }
                        }
                    ],
                    as: "driver"
                }
            },
            {
                $unwind: { path: "$driver", preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: "users",
                    let: { managerId: { $toObjectId: "$managerId" } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$managerId"] }
                            }
                        },
                        {
                            $project: {
                                name: 1,
                                role: 1,
                                email: 1
                            }
                        }
                    ],
                    as: "manager"
                }
            },
            {
                $unwind: { path: "$manager", preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: "users",
                    let: { enteredBy: { $toObjectId: "$enteredBy" } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$enteredBy"] }
                            }
                        },
                        {
                            $project: {
                                name: 1,
                                role: 1,
                                email: 1,
                            }
                        }
                    ],
                    as: "enteredBy"
                }
            },
            {
                $unwind: { path: "$enteredBy", preserveNullAndEmptyArrays: true }
            },
            {
                $sort: {
                    enteredAt: -1
                }
            }
        ]).toArray();

        return result;
    } catch (error) {
        throw Error
    }
}

export const getIncidentsLastSixMonths = async (from, toDate) => {
    const fromTs = Number(from);
    const toTs = Number(toDate);
    try {
        const collection = await getCollection("incidents");

        const result = await collection.aggregate([

            // ✅ STEP 1: Filter FIRST (very important for performance)
            {
                $match: {
                    incidentTime: {
                        $gte: fromTs,
                        $lte: toTs,
                    },
                },
            },

            // ✅ DRIVER LOOKUP
            {
                $lookup: {
                    from: "users",
                    let: { driverId: { $toObjectId: "$driverId" } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$driverId"] },
                            },
                        },
                        {
                            $project: {
                                name: 1,
                                srsDriverNumber: 1,
                                email: 1,
                                site: 1,
                                profileImage: 1,
                            },
                        },
                    ],
                    as: "driver",
                },
            },
            {
                $unwind: { path: "$driver", preserveNullAndEmptyArrays: true },
            },

            // ✅ MANAGER LOOKUP
            {
                $lookup: {
                    from: "users",
                    let: { managerId: { $toObjectId: "$managerId" } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$managerId"] },
                            },
                        },
                        {
                            $project: {
                                name: 1,
                                role: 1,
                                email: 1,
                            },
                        },
                    ],
                    as: "manager",
                },
            },
            {
                $unwind: { path: "$manager", preserveNullAndEmptyArrays: true },
            },

            // ✅ ENTERED BY LOOKUP
            {
                $lookup: {
                    from: "users",
                    let: { enteredBy: { $toObjectId: "$enteredBy" } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$enteredBy"] },
                            },
                        },
                        {
                            $project: {
                                name: 1,
                                role: 1,
                                email: 1,
                            },
                        },
                    ],
                    as: "enteredBy",
                },
            },
            {
                $unwind: { path: "$enteredBy", preserveNullAndEmptyArrays: true },
            },

            // ✅ SORT (latest first)
            {
                $sort: {
                    enteredAt: -1,
                },
            },
        ]).toArray();
        

        return result;

    } catch (error) {
        console.error("Error fetching filtered incidents:", error);
        throw error;
    }
};


