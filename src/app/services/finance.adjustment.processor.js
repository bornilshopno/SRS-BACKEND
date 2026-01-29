import { AdjustmentRepo } from "../../utils/adjustments.repo";

// services/finance/adjustment.processor.js
export const processAdjustment = async (
  refId,
  adjustments
) =>
  withTransaction(async (session) => {
    const adj = await AdjustmentRepo.findById(refId, session);
    if (!adj) throw new Error("Adjustment not found");

    await applyInstallments(adj, adjustments);

    await AdjustmentRepo.save(adj, session);
  });
