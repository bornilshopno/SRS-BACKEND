// services/finance/installment.engine.js
export const applyInstallments = async (
  account,
  adjustments
) => {
console.log("applyInstallments", adjustments)

  for (const adj of adjustments) {
    const old = account.history.find(
      h => h.invoiceId === adj.invoiceId
    );

    // 🔁 revert
    if (old) {
      account.remaining -= old.delta;
      account.history = account.history.filter(
        h => h.invoiceId !== adj.invoiceId
      );
    }

    // ➕ apply
    const delta = -adj.paid;
    const prev = account.remaining;

    account.remaining += delta;

    account.history.push({
      invoiceId: adj.invoiceId,
      revision: adj.revision,
      year: adj.year,
      week: adj.week,
      paid: adj.paid,
      delta,
      previousRemaining: prev,
      newRemaining: account.remaining,
      createdAt: Date.now()
    });
  }

  if (account.remaining <= 0) {
    account.remaining = 0;
    account.status = "CLOSED";
  }
};
