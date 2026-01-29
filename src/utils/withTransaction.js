// utils/withTransaction.js
export const withTransaction = async (fn) => {
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
