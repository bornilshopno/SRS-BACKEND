import { ObjectId } from "mongodb";
import { getCollection } from "./getCollection.js";


const COLLECTION = "adjustments";

export const AdjustmentRepo = {
  async findById(id, session) {
    const col = await getCollection(COLLECTION);
    return col.findOne(
      { _id: new ObjectId(id) },
      { session }
    );
  },

  async save(adjustment, session) {
    const col = await getCollection(COLLECTION);
    await col.updateOne(
      { _id: adjustment._id },
      { $set: adjustment },
      { session }
    );
  }
};
