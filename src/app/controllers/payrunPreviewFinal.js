import { getCollection } from "../../utils/getCollection.js";

/* ------------------------------------------------
   Helper Function
-------------------------------------------------*/
function getEffectiveInstallment(doc) {
  const carry = Number(doc.carryForward || 0);
  const base = Number(doc.installmentAmount || 0);
  return base + carry;
}

function calculateTotals(adjustmentsArray) {
  const total = adjustmentsArray.reduce(
    (s, a) => s + Math.min(getEffectiveInstallment(a), a.remaining),
    0
  );
  return total
}


export async function payrunPreviewFinal(req, res) {
  try {
    const loanCollection = await getCollection("loans");
    const adjustmentsCollection = await getCollection("adjustments");
    const { driverId, weeklyTotal, vatAmount, year, week } = req.body;

    /* ------------------------------------------------
       1️⃣ Fetch adjustments
    -------------------------------------------------*/
    const adjustments = await adjustmentsCollection.find({
      driverId,
      status: "ACTIVE",
      remaining: { $gt: 0 },
      $expr: {
        $or: [
          { $lt: ["$startYear", year] },
          {
            $and: [
              { $eq: ["$startYear", year] },
              { $lte: ["$startWeek", week] }
            ]
          }
        ]
      }
    }).toArray();

    const ctpAdjustments = adjustments.filter(
      a => a.type === "CTP" && a.direction === "ADD"
    );
    const dbsAdjustments = adjustments.filter(
      a => a.type === "DBS" && a.direction === "DEDUCT"
    );
    const penaltyAdjustments = adjustments.filter(
      a => a.type === "PENALTY" && a.direction === "DEDUCT"
    );

    const deductionAdjustments = adjustments.filter(
      a => ["DBS", "PENALTY"].includes(a.type) && a.direction === "DEDUCT"
    );

    /* ------------------------------------------------
       2️⃣ Fetch loans
    -------------------------------------------------*/
    const loans = await loanCollection.find({
      driverId,
      status: "ACTIVE",
      remaining: { $gt: 0 }
    }).toArray();

    /* ------------------------------------------------
       3️⃣ Earnings
    -------------------------------------------------*/
    const ctpTotal = ctpAdjustments.reduce(
      (s, a) => s + Math.min(a.installmentAmount, a.remaining),
      0
    );

    const totalAvailable = weeklyTotal + vatAmount + ctpTotal;

    /* ------------------------------------------------
       4️⃣ Totals (for UI)
    -------------------------------------------------*/
    // const dbsTotal = dbsAdjustments.reduce(
    //   (s, a) => s + Math.min(getEffectiveInstallment(a), a.remaining),
    //   0
    // );

    // const penaltyTotal = penaltyAdjustments.reduce(
    //   (s, a) => s + Math.min(a.installmentAmount, a.remaining),
    //   0
    // );

    // const loanTotal = loans.reduce(
    //   (s, l) => s + Math.min(l.installmentAmount, l.remaining),
    //   0
    // );

    const dbsTotal = calculateTotals(dbsAdjustments);
    const penaltyTotal = calculateTotals(penaltyAdjustments);
    const loanTotal = calculateTotals(loans)



    const loanInstallments = loans.map(l => {
      const effective = getEffectiveInstallment(l);
      const scheduled = Math.min(effective, l.remaining);

      return {
        source: "LOAN",
        refId: l._id,
        baseInstallment: l.installmentAmount,
        previousCarryForward: l.carryForward || 0,
        effectiveInstallment: effective,
        scheduled,
        direction: l.direction
      };
    });


    const adjustmentInstallments = deductionAdjustments.map(a => {
      const effective = getEffectiveInstallment(a);
      const scheduled = Math.min(effective, a.remaining);

      return {
        source: a.type,
        refId: a._id,
        baseInstallment: a.installmentAmount,
        previousCarryForward: a.carryForward || 0,
        effectiveInstallment: effective,
        scheduled,
        direction: a.direction
      };
    });


    const allInstallments = [...loanInstallments, ...adjustmentInstallments];

    const totalScheduledDeductions = allInstallments.reduce(
      (s, i) => s + i.scheduled,
      0
    );

    /* ------------------------------------------------
       6️⃣ Proportional deduction (NO premature rounding)
    -------------------------------------------------*/
    let ratio = 1;
    if (totalScheduledDeductions > 0 && totalAvailable < totalScheduledDeductions) {
      ratio = totalAvailable / totalScheduledDeductions;
    }

    let deductions = allInstallments.map(i => {
      const paid = Math.round(i.scheduled * ratio * 100) / 100;
      const carryForward = i.scheduled - paid; // IMPORTANT
      return { ...i, paid, carryForward };
    });

    /* ------------------------------------------------
       7️⃣ Rounding reconciliation
    -------------------------------------------------*/
    let totalPaid = deductions.reduce((s, d) => s + d.paid, 0);
    let totalCarry = deductions.reduce((s, d) => s + d.carryForward, 0);

    totalPaid = Math.round(totalPaid * 100) / 100;
    totalCarry = Math.round(totalCarry * 100) / 100;

    const roundingDrift =
      Math.round(
        (totalScheduledDeductions - (totalPaid + totalCarry)) * 100
      ) / 100;

    if (roundingDrift !== 0) {
      const firstLoanIndex = deductions.findIndex(d => d.source === "LOAN");
      if (firstLoanIndex !== -1) {
        deductions[firstLoanIndex].carryForward =
          Math.round(
            (deductions[firstLoanIndex].carryForward + roundingDrift) * 100
          ) / 100;
      }
    }

    /* ------------------------------------------------
       8️⃣ Final rounding (display safe)
    -------------------------------------------------*/
    deductions = deductions.map(d => ({
      ...d,
      paid: Math.round(d.paid * 100) / 100,
      carryForward: Math.round(d.carryForward * 100) / 100
    }));

    const totalDeducted = Math.round(
      deductions.reduce((s, d) => s + d.paid, 0) * 100
    ) / 100;

    const totalCarryForward = Math.round(
      deductions.reduce((s, d) => s + d.carryForward, 0) * 100
    ) / 100;

    let netPayment = Math.max(
      Math.round((totalAvailable - totalDeducted) * 100) / 100,
      0
    );

    /* ------------------------------------------------
       9️⃣ < £1 net payment rule
    -------------------------------------------------*/
    if (netPayment > 0 && netPayment < 1) {
      const firstLoanIndex = deductions.findIndex(d => d.source === "LOAN");
      if (firstLoanIndex !== -1) {
        deductions[firstLoanIndex].carryForward =
          Math.round(
            (deductions[firstLoanIndex].carryForward + netPayment) * 100
          ) / 100;
        netPayment = 0;
      }
    }

    /* ------------------------------------------------
       🔟 Adjustment summary
    -------------------------------------------------*/
    const ctpInstallments = ctpAdjustments.map(c => ({
      source: "CTP",
      refId: c._id,
      baseInstallment: c.installmentAmount,
      paid: Math.min(c.installmentAmount, c.remaining),
      direction: c.direction
    }));

    const totalAdjusted = [...ctpInstallments, ...deductions];

    /* ------------------------------------------------
       11️⃣ Response
    -------------------------------------------------*/
    return res.json({
      success: true,
      driverData: {
        weeklyTotal,
        vatAmount,
        ctpTotal,
        loanTotal,
        dbsTotal,
        penaltyTotal,
        totalAvailable,
        totalScheduledDeductions,
        totalDeducted,
        totalCarryForward,
        netPayment,
        totalAdjusted,
        deductions,
        loansFound: loans,
        adjustmentFound: adjustments
      }
    });

  } catch (error) {
    console.error("payrunPreviewFinal error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate payrun preview"
    });
  }
}
