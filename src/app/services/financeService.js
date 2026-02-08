import { ObjectId } from "mongodb";
import { getCollection } from "../../utils/getCollection.js";
import { extractAdjustments, formatAdjustments } from "./finance.extractor.js";
import { groupBy } from "../../utils/groupBy.js";
import { markInvoiceApplied, markInvoiceFailed } from "./invoiceStatusMarker.js";
import { withTransaction } from "../../utils/withTransaction.js";
import { applyInstallments } from "./finance.apply.installments.js";
import { dedupeByKey } from "../../utils/dedupeByKey.js";
import { AdjustmentRepo } from "../../utils/adjustments.repo.js";
import { LoanRepo } from "../../utils/loan.repo.js";


/* ------------------ helpers ------------------ */

async function getInvoiceCollection() {
  return await getCollection("invoices");
}

const getInvoiceById = async (invoiceId) => {
  const col = await getInvoiceCollection();
  return col.findOne({ _id: new ObjectId(invoiceId) });
};



/* ---------------- Core Finance Processor ---------------- */

export const processInvoiceFinance = async (invoiceId) => {
  const invoice = await getInvoiceById(invoiceId);
  // console.log("from processInvoiceFinance", invoiceId)//receives id

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  try {
    /* 1️⃣ Extract normalized adjustments */
    const adjustments = extractAdjustments(invoice);
    // console.log("financeService", adjustments)//okay
    if (!adjustments.length) {
      await markInvoiceApplied(invoiceId);
      return;
    }

    /* 2️⃣ Idempotency protection */
    const uniqueAdjustments = dedupeByKey(
      adjustments,
      a => `${a.invoiceId}-${a.refId}`
    );

    // console.log("unique", uniqueAdjustments)//Okay

    /* 3️⃣ Group by source */
    const bySource = groupBy(uniqueAdjustments, a => a.source);

    // console.log("bySource", bySource)//working
    /* 4️⃣ LOAN processing */
    if (bySource.LOAN) {
      const byLoan = groupBy(bySource.LOAN, a => a.refId);
      // console.log("byLoadn", byLoan)//okay
      for (const loanId in byLoan) {
        await withTransaction(async (session) => {
          const loan = await LoanRepo.findById(loanId, session);
          if (!loan) {
            throw new Error(`Loan not found: ${loanId}`);
          }

          await applyInstallments(loan, byLoan[loanId]);
          await LoanRepo.save(loan, session);
        });
      }
    }

    /* 5️⃣ Adjustment processing (PENALTY / DBS / CTP) */
    const otherTypes = ["PENALTY", "DBS", "CTP"];

    for (const type of otherTypes) {
      if (!bySource[type]) continue;

      const grouped = groupBy(bySource[type], a => a.refId);

      for (const refId in grouped) {
        await withTransaction(async (session) => {
          const adj = await AdjustmentRepo.findById(refId, session);
          if (!adj) {
            throw new Error(`Adjustment not found: ${refId}`);
          }

          await applyInstallments(adj, grouped[refId]);
          await AdjustmentRepo.save(adj, session);
        });
      }
    }

    /* 6️⃣ Mark invoice finance-applied */
    await markInvoiceApplied(invoiceId);

  } catch (error) {
    /* ❌ Safe failure */
    await markInvoiceFailed(invoiceId, error);
    throw error;
  }
};

/* ------------------ revise financial adjustments ------------------ */
export const reviseInvoiceFinance = async (revisedAdjustments, invoiceDoc) => {
  if (!revisedAdjustments.length) {
    await markInvoiceApplied(invoiceDoc.id);
    return;
  }
  try {
    /* 1️⃣ Extract normalized adjustments */
    const adjustments = formatAdjustments(revisedAdjustments, invoiceDoc)

    

    /* 2️⃣ Idempotency protection */
    const uniqueAdjustments = dedupeByKey(
      adjustments,
      a => `${a.invoiceId}-${a.refId}`
    );

    /* 3️⃣ Group by source */
    const bySource = groupBy(uniqueAdjustments, a => a.source);

    /* 4️⃣ LOAN processing */
    if (bySource.LOAN) {
      const byLoan = groupBy(bySource.LOAN, a => a.refId);
      // console.log("byLoadn", byLoan)//okay
      for (const loanId in byLoan) {
        await withTransaction(async (session) => {
          const loan = await LoanRepo.findById(loanId, session);
          if (!loan) {
            throw new Error(`Loan not found: ${loanId}`);
          }

          await applyInstallments(loan, byLoan[loanId]);
          await LoanRepo.save(loan, session);
        });
      }
    }

    /* 5️⃣ Adjustment processing (PENALTY / DBS / CTP) */
    const otherTypes = ["PENALTY", "DBS", "CTP"];

    for (const type of otherTypes) {
      if (!bySource[type]) continue;

      const grouped = groupBy(bySource[type], a => a.refId);

      for (const refId in grouped) {
        await withTransaction(async (session) => {
          const adj = await AdjustmentRepo.findById(refId, session);
          if (!adj) {
            throw new Error(`Adjustment not found: ${refId}`);
          }

          await applyInstallments(adj, grouped[refId]);
          await AdjustmentRepo.save(adj, session);
        });
      }
    }



    /* 6️⃣ Mark invoice finance-applied */
    await markInvoiceApplied(invoiceDoc.id);

    return ({success: true})

  } catch (error) {
    await markInvoiceFailed(invoiceDoc.id, error);
    throw error;
  }
}

/* ------------------ unified installment engine ------------------ */

const processInstallmentAccount = async (accountId, adjustments) =>
  withTransaction(async (session) => {
    const account = await InstallmentRepo.findById(accountId, session);

    if (!account) {
      throw new Error(`Installment account not found: ${accountId}`);
    }

    for (const adj of adjustments) {
      /**
       * 🔁 Revert old application (revision-safe)
       */
      const old = account.history.find(
        h => h.invoiceId === adj.invoiceId
      );

      if (old) {
        account.remainingAmount = old.previousRemaining;
        account.history = account.history.filter(
          h => h.invoiceId !== adj.invoiceId
        );
      }

      /**
       * ➕ Apply new adjustment
       * Always negative for installment systems
       */
      const delta = -adj.paid;
      const prev = account.remainingAmount;

      account.remainingAmount += delta;

      account.history.push({
        invoiceId: adj.invoiceId,
        revision: adj.revision,
        year: adj.year,
        week: adj.week,
        paid: adj.paid,
        delta,
        previousRemaining: prev,
        newRemaining: account.remainingAmount,
        createdAt: Date.now()
      });
    }

    /**
     * ✅ Auto-close if fully paid
     */
    if (account.remainingAmount <= 0) {
      account.remainingAmount = 0;
      account.status = "CLOSED";
      account.closedAt = Date.now();
    }

    await InstallmentRepo.save(account, session);
  });
