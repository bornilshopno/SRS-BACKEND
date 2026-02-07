


export async function revisedPayrunPreview(req, res) {
    try {
        const { weeklyTotal, vatAmount, totalAdjustments } = req.body
        console.log(weeklyTotal, vatAmount, totalAdjustments)

        /* ------------------------------------------------
          1️⃣ Separate adjustments
       -------------------------------------------------*/


        const ctpAdjustments = totalAdjustments.filter(
            a => a.source === "CTP" && a.direction === "ADD"
        );
        const dbsAdjustments = totalAdjustments.filter(
            a => a.source === "DBS" && a.direction === "DEDUCT"
        );
        const penaltyAdjustments = totalAdjustments.filter(
            a => a.source === "PENALTY" && a.direction === "DEDUCT"
        );


        const loans = totalAdjustments.filter(
            a => a.source === "LOAN" && a.direction === "DEDUCT"
        );

        const deductionAdjustments = totalAdjustments.filter(
            a => ["DBS", "PENALTY"].includes(a.source) && a.direction === "DEDUCT"
        );

        /* ------------------------------------------------
           2. Totals (for UI)
        -------------------------------------------------*/
        const ctpTotal = ctpAdjustments.reduce(
            (s, a) => s + a.paid,
            0
        );

        const totalAvailable = weeklyTotal + vatAmount + ctpTotal;


        const dbsTotal = dbsAdjustments.reduce(
            (s, a) => s + a.scheduled,
            0
        );

        const penaltyTotal = penaltyAdjustments.reduce(
            (s, a) => s + a.scheduled,
            0
        );
        const loanTotal = loans.reduce(
            (s, a) => s + a.scheduled,
            0
        )

        /* ------------------------------------------------
        3. forming return arrays
        -------------------------------------------------*/

        const loanInstallments = loans.map(l => {
            const { paid, carryForward, ...others } = l;
            return others

        });

        const adjustmentInstallments = deductionAdjustments.map(a => {
            const { paid, carryForward, ...others } = a;
            return others

        })

        const allInstallments = [...loanInstallments, ...adjustmentInstallments];

        const totalScheduledDeductions = allInstallments.reduce(
            (s, i) => s + i.scheduled,
            0
        );

        /* ------------------------------------------------
       4. Proportional deduction (NO premature rounding)
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
           5. Rounding reconciliation
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
           6. Final rounding (display safe)
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
           7. < £1 net payment rule
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

        const totalAdjusted = [...ctpAdjustments, ...deductions];

        /* ------------------------------------------------
       8. Response
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


