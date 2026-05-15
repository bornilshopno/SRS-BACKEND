import { getCollection } from "./getCollection.js";

// utils/getNextSequence.js
export const getNextSequence = async (sequenceName) => {
    const collection = await getCollection("counters")
    const result = await collection.findOneAndUpdate(
        { _id: sequenceName },              // find this counter
        { $inc: { seq: 1 } },               // increment by 1
        {
            returnDocument: "after",          // return updated value
            upsert: true,                     // create if not exists
        }
    );
console.log("Sequence", sequenceName, result)
    return result.seq;              // return the number
};

