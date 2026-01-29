import { ObjectId } from "mongodb";
import { getCollection } from "./getCollection.js";


const COLLECTION = "loans";

export const LoanRepo = {
  async findById(id, session) {
    const col = await getCollection(COLLECTION);
    return col.findOne(
      { _id: new ObjectId(id) },
      { session }
    );
  },

  async save(loan, session) {
    const col = await getCollection(COLLECTION);
    await col.updateOne(
      { _id: loan._id },
      { $set: loan },
      { session }
    );
  }
};
