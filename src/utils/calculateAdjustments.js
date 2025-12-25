export async function calculateAdjustments({
  weeklyTotal,
  vatAmount,
  ctpAdjustments = [],
  dbsAdjustments = [],
  penaltyAdjustments = [],
  loans = []
}) {
  let earnings = weeklyTotal + vatAmount;

  const breakdown = {
    ctp: [],
    dbs: [],
    penalties: [],
    loans: []
  };

  const totals = {
    ctp: 0,
    dbs: 0,
    penalties: 0,
    loans: 0
  };

  /* 1️⃣ Apply CTP earnings */
  ctpAdjustments.forEach(a => {
    if (a.remaining <= 0) return;

    const earn = Math.min(a.installmentAmount, a.remaining);

    breakdown.ctp.push({
      adjustmentId: a._id,
      added: earn,
      remainingAfter: a.remaining - earn,
      carryForward: a.installmentAmount - earn
    });

    totals.ctp += earn;
    earnings += earn;
  });

  /* Gross pay after earnings */
  let available = earnings;

  /* 2️⃣ DBS deductions */
  dbsAdjustments.forEach(a => {
    if (available <= 0) return;

    const deduct = Math.min(a.installmentAmount, a.remaining, available);
    if (deduct <= 0) return;

    breakdown.dbs.push({
      adjustmentId: a._id,
      deducted: deduct,
      remainingAfter: a.remaining - deduct,
      carryForward: a.installmentAmount - deduct
    });

    totals.dbs += deduct;
    available -= deduct;
  });

  /* 3️⃣ Penalty deductions */
  penaltyAdjustments.forEach(a => {
    if (available <= 0) return;

    const deduct = Math.min(a.installmentAmount, a.remaining, available);
    if (deduct <= 0) return;

    breakdown.penalties.push({
      adjustmentId: a._id,
      deducted: deduct,
      remainingAfter: a.remaining - deduct,
      carryForward: a.installmentAmount - deduct
    });

    totals.penalties += deduct;
    available -= deduct;
  });

  /* 4️⃣ Loan deductions */
  loans.forEach(l => {
    if (available <= 0) return;

    const effectiveInstallment =
      l.installmentAmount + (l.carryForward || 0);

    const deduct = Math.min(effectiveInstallment, l.remaining, available);
    if (deduct <= 0) return;

    breakdown.loans.push({
      loanId: l._id,
      deducted: deduct,
      remainingAfter: l.remaining - deduct,
      carryForward: effectiveInstallment - deduct
    });

    totals.loans += deduct;
    available -= deduct;
  });

  return {
    weeklyTotal,
    vatAmount,
    earningsBeforeDeductions: earnings,
    netPay: available,
    totals,
    breakdown
  };
}
