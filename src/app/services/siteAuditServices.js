import { ObjectId } from "mongodb";
import { getCollection } from "../../utils/getCollection.js"


export const addAuditDataToDB = async (data) => {
    const collection = await getCollection("site-audits")
    const dataToInsert = {
        ...data,
        enteredAt: Date.now(),
    };

    const result = await collection.insertOne(dataToInsert)
    return result
}



export const getAllAuditData = async (id, site) => {

    try {
        const collection = await getCollection("site-audits");

        const pipeline = [];
        console.log("id from service", id)
        // ✅ conditionally add match
        if (id) {
            console.log("pipeline run")
            pipeline.push({
                $match: { _id: new ObjectId(id) }
            });
        }


        // rest of pipeline
        pipeline.push(
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
            })

        if (site) {
            pipeline.push({
                $match: {
                    "site": site.toLowerCase()
                }
            });
        };

        pipeline.push(
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
            $lookup: {
                from: "users",
                    let: { updatedBy: { $toObjectId: "$updatedBy" } },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$_id", "$$updatedBy"] }
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
                    as: "updatedBy"
            }
        },
        {
            $unwind: { path: "$updatedBy", preserveNullAndEmptyArrays: true }
        },
            {
                $sort: {
                    enteredAt: -1
                }
            }
        );

        const result = await collection.aggregate(pipeline).toArray();
        console.log("normal result", result?.length)

        return result;

    } catch (error) {
        throw error;
    }
};

export const updateSingleAuditReport = async (body) => {
    const { driverId, ...rest } = body
    const updateDoc = {
        ...rest,
        updatedAt: Date.now(),
    };
    const filter = { driverId: driverId };
    const collection = await getCollection("site-audits");
    const result = await collection.updateOne(
        filter,
        { $set: updateDoc },
        { upsert: true }
    )
    return result
}



