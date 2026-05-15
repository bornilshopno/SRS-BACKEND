import { ObjectId } from "mongodb";
import { getCollection } from "../../utils/getCollection.js"
import { getNextSequence } from "../../utils/getSequence.js";

export const addMatrixToDB = async (data) => {
    const collection = await getCollection("aah-matrix")
    const seq = await getNextSequence("aahMatrixNumber");
    const dataToInsert = {
        ...data,
        aahMatrixNumber: `AM${seq}`,   // AM1, AM2, AM3...
        enteredAt: Date.now(),
    };

    const result = await collection.insertOne(dataToInsert)
    return result
}



export const getAllAahMatrixData = async (id, site) => {

    try {
        const collection = await getCollection("aah-matrix");

        const pipeline = [];
        
        // ✅ conditionally add match
        if (id) {

            // console.log("pipeline run")
            pipeline.push({
                $match: { driverId: id }
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
                    "driver.site": { $regex: `^${site}$`, $options: "i" }
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
        if (id) {
            console.log("result when have ID", result?.length)
            return result[0] || null;
        }

        // if (site) {
        //     const siteResult = result.filter(r => r.driver.site.toLowerCase() === site.toLowerCase())
        //     return siteResult
        // }
        // return result;

    } catch (error) {
        throw error;
    }
};

export const updateMatrixService = async (body) => {
    const { driverId, ...rest } = body
    const updateDoc = {
        ...rest,
        updatedAt: Date.now(),
    };
    const filter = { driverId: driverId };
    const collection = await getCollection("aah-matrix");
    const result = await collection.updateOne(
        filter,
        { $set: updateDoc },
        { upsert: true }
    )
    return result
}



