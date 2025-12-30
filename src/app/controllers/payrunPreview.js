import { getCollection } from "../../utils/getCollection.js";

export async function payrunPreview(req, res) {
    try {
        const loanCollection = await getCollection("loans");
        const adjustmentsCollection = await getCollection("adjustments");

        const { driverId, weeklyTotal, vatAmount, year, week } = req.body;
        console.log("req.body", req.body)
        /* -----------------------------
           1️⃣ Fetch applicable adjustments
        --------------------------------*/
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

        /* Split adjustments */
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

        /* -----------------------------
           2️⃣ Fetch active loans
        --------------------------------*/
        const loans = await loanCollection.find({
            driverId,
            status: "ACTIVE",
            remaining: { $gt: 0 }
        }).toArray();

        /* -----------------------------
           3️⃣ Build earnings side
        --------------------------------*/
        const ctpTotal = ctpAdjustments.reduce(
            (sum, a) => sum + Math.min(a.installmentAmount, a.remaining),
            0
        );

        /* -----------------------------
          3️⃣ Build deductions side
       --------------------------------*/
        const dbsTotal = dbsAdjustments.reduce(
            (sum, a) => sum + Math.min(a.installmentAmount, a.remaining),
            0
        );
        const penaltyTotal = penaltyAdjustments.reduce(
            (sum, a) => sum + Math.min(a.installmentAmount, a.remaining),
            0
        );

        const loanTotal = loans.reduce(
            (sum, a) => sum + Math.min(a.installmentAmount, a.remaining), 0
        )

        const totalAvailable =
            weeklyTotal +
            vatAmount +
            ctpTotal;

        /* -----------------------------
           4️⃣ Build deduction side (weekly snapshot)
        --------------------------------*/
        const loanInstallments = loans.map(l => {
            const scheduled = Math.min(l.installmentAmount, l.remaining);

            return {
                source: "LOAN",
                refId: l._id,
                baseInstallment: l.installmentAmount,
                scheduled
            };
        });

        const adjustmentInstallments = deductionAdjustments.map(a => {
            const scheduled = Math.min(a.installmentAmount, a.remaining);

            return {
                source: a.type, // DBS | PENALTY
                refId: a._id,
                baseInstallment: a.installmentAmount,
                scheduled
            };
        });

        const allInstallments = [
            ...loanInstallments,
            ...adjustmentInstallments
        ];

        const totalScheduledDeductions = allInstallments.reduce(
            (sum, i) => sum + i.scheduled,
            0
        );

        /* -----------------------------
           5️⃣ Apply proportional deduction
        --------------------------------*/
        let ratio = 1;

        if (
            totalScheduledDeductions > 0 &&
            totalAvailable < totalScheduledDeductions
        ) {
            ratio = totalAvailable / totalScheduledDeductions;
        }

        const deductions = allInstallments.map(i => {
            const paid = Math.round(i.scheduled * ratio * 100) / 100;
            const carryForward =
                Math.round((i.scheduled - paid) * 100) / 100;

            return {
                ...i,
                paid,
                carryForward
            };
        });

        const totalDeducted = deductions.reduce(
            (sum, d) => sum + d.paid,
            0
        );

        const totalCarryForward = deductions.reduce(
            (sum, d) => sum + d.carryForward,
            0
        );

        const netPayment = Math.max(
            Math.round((totalAvailable - totalDeducted) * 100) / 100,
            0
        );


         /* -----------------------------
           4️⃣ for summarising adjustments
        --------------------------------*/
        const ctpInstallments = ctpAdjustments.map(c => {
            const scheduled = Math.min(c.installmentAmount, c.remaining);

            return {
                source: "CTP",
                refId: c._id,
                baseInstallment: c.installmentAmount,
                paid: scheduled
            };
        });

        const totalAdjusted= [...ctpInstallments,...deductions]

        /* -----------------------------
           6️⃣ Response (PREVIEW ONLY)
        --------------------------------*/
        return res.json({
            success: true,
            driverData: {
                weeklyTotal,
                vatAmount,
                ctpTotal,loanTotal,dbsTotal,penaltyTotal,
                totalAvailable,
                totalScheduledDeductions,
                totalDeducted,
                netPayment,
                totalAdjusted,
                deductions,
                adjustmentFound: adjustments,
                loansFound: loans,
                totalCarryForward
            }
        });

    } catch (error) {
        console.error("payrunBefore error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate payrun preview"
        });
    }
}


// [
//     {
//         "source": "LOAN",
//         "refId": "694d8a44d4fdce4079d6f04f",
//         "baseInstallment": 200,
//         "scheduled": 200,
//         "paid": 200,
//         "carryForward": 0
//     },
//     {
//         "source": "LOAN",
//         "refId": "694d8a72d4fdce4079d6f050",
//         "baseInstallment": 20,
//         "scheduled": 20,
//         "paid": 20,
//         "carryForward": 0
//     },
//     {
//         "source": "LOAN",
//         "refId": "694d8a8cd4fdce4079d6f051",
//         "baseInstallment": 133,
//         "scheduled": 133,
//         "paid": 133,
//         "carryForward": 0
//     },
//     {
//         "source": "PENALTY",
//         "refId": "694d8aa4d4fdce4079d6f052",
//         "baseInstallment": 140,
//         "scheduled": 140,
//         "paid": 140,
//         "carryForward": 0
//     },
//     {
//         "source": "PENALTY",
//         "refId": "694d8ae0d4fdce4079d6f053",
//         "baseInstallment": 110,
//         "scheduled": 110,
//         "paid": 110,
//         "carryForward": 0
//     },
//     {
//         "source": "PENALTY",
//         "refId": "694d8b00d4fdce4079d6f055",
//         "baseInstallment": 100,
//         "scheduled": 100,
//         "paid": 100,
//         "carryForward": 0
//     }
// ]