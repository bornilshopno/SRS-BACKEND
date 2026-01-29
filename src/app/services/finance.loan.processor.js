import { LoanRepo } from "../../utils/loan.repo.js";
import { withTransaction } from "../../utils/withTransaction.js";



export const processLoanAdjustments = async (
  loanId,
  adjustments
) =>
  withTransaction(async (session) => {
    const loan = await LoanRepo.findById(loanId, session);
    if (!loan) throw new Error("Loan not found");

    await applyInstallments(loan, adjustments);

    await LoanRepo.save(loan, session);
  });
