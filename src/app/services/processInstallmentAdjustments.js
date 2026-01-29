export const processInstallmentAdjustments = async (
  accountId,
  adjustments
) =>
  withTransaction(async (session) => {
    const account = await InstallmentRepo.findById(accountId, session);

    for (const adj of adjustments) {
      const old = account.history.find(
        h => h.invoiceId === adj.invoiceId
      );

      // 🔁 revert old
      if (old) {
        account.remainingAmount = old.previousRemaining;
        account.history = account.history.filter(
          h => h.invoiceId !== adj.invoiceId
        );
      }

      // ➕ apply new
      const delta = -adj.paid; // ALWAYS negative
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

    if (account.remainingAmount <= 0) {
      account.status = "CLOSED";
      account.remainingAmount = 0;
    }

    await InstallmentRepo.save(account, session);
  });
