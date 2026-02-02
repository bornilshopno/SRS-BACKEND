import { client } from "../config/db.js";

// utils/withTransaction.js
export const withTransaction = async (fn) => {

  if(!client) throw new Error ("MongoDb Client not initialized")

  const session = client.startSession();
  try {
    session.startTransaction();
    await fn(session);
    await session.commitTransaction();
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
};
