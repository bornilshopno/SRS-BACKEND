// services/finance/installment.engine.js


export const applyInstallments = async (account, adjustments) => {
  account.carryForward ||= 0;
  account.history ||= [];

  for (const adj of adjustments) {

    const old = account.history.find(
      h => h.invoiceId === adj.invoiceId
    );

    // 🔁 REVERT OLD ENTRY
    if (old) {
      account.remaining -= old.delta;
      account.history = account.history.filter(
        h => h.invoiceId !== adj.invoiceId
      );
    }

    // ➕ APPLY NEW ENTRY
    const prevRemaining = account.remaining;

    const paid = adj.paid;
    const delta = -paid;
    const carryForward = adj.carryForward;
    let carryForwardDelta = -carryForward;

    let newRemaining = prevRemaining + delta;



    // 💡 handle overpayment
    if (newRemaining < 0) {
      carryForwardDelta = carryForwardDelta + Math.abs(newRemaining);
      newRemaining = 0;
    }

    account.remaining = newRemaining;
    account.carryForward = -carryForwardDelta;

    account.history.push({
      invoiceId: adj.invoiceId,
      revision: adj.revision,
      year: adj.year,
      week: adj.week,
      paid,
      delta,
      previousRemaining: prevRemaining,
      newRemaining,
      carryForwardDelta,
      invoicedAt: Date.now()
    });
  }

  if (account.remaining <= 0) {
    account.remaining = 0;
    account.status = "CLOSED";
  }
};
