import { getCollection } from "../../utils/getCollection.js";

export async function payrunBefore(req, res) {
    const loanCollection = await getCollection("loans");
    const adjustmentsCollection = await getCollection("adjustments");

    const { driverId, weeklyTotal, vatAmount, year, week } = req.body;

    /* -----------------------------
       1️⃣ Fetch applicable adjustments
    --------------------------------*/
    const adjustments = await adjustmentsCollection.find({
        driverId,
        isActive: true,
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

    console.log("adjustments-before", adjustments)

    /* Split adjustments */
    const ctpAdjustments = adjustments.filter(
        a => a.type === "CTP" && a.direction === "ADD"
    );

    const deductionAdjustments = adjustments.filter(
        a => ["DBS", "PENALTY"].includes(a.type)
    );

    /* -----------------------------
       2️⃣ Fetch active loans
    --------------------------------*/
    const loans = await loanCollection.find({
        driverId,
        status: "ACTIVE",
        remaining: { $gt: 0 }
    }).toArray();

    console.log("loansBfore", loans)
    /* -----------------------------
       3️⃣ Build earnings side
    --------------------------------*/
    const ctpTotal = ctpAdjustments.reduce(
        (sum, a) => sum + a.installmentAmount,
        0
    );

    const totalAvailable =
        weeklyTotal +
        vatAmount +
        ctpTotal;

    /* -----------------------------
       4️⃣ Build deduction side
    --------------------------------*/
    const loanInstallments = loans.map(l => ({
        source: "LOAN",
        refId: l._id,
        scheduled: Math.min(l.installmentAmount, l.remaining)
    }));

    const adjustmentInstallments = deductionAdjustments.map(a => ({
        source: a.type, // DBS | PENALTY
        refId: a._id,
        scheduled: Math.min(a.installmentAmount, a.remaining)
    }));

    const allInstallments = [
        ...loanInstallments,
        ...adjustmentInstallments
    ];

    const totalScheduledDeductions = allInstallments.reduce(
        (sum, i) => sum + i.scheduled,
        0
    );

    /* -----------------------------
       5️⃣ Apply proportional logic
    --------------------------------*/
    let ratio = 1;
    if (totalScheduledDeductions > 0 && totalAvailable < totalScheduledDeductions) {
        ratio = totalAvailable / totalScheduledDeductions;
    }

    const deductionPreview = allInstallments.map(i => {
        const paid = Math.round(i.scheduled * ratio * 100) / 100;
        const carryForward = i.scheduled - paid;

        return {
            ...i,
            paid,
            carryForward
        };
    });

    const totalDeducted = deductionPreview.reduce(
        (sum, d) => sum + d.paid,
        0
    );

    const totalCarryForward=deductionPreview.reduce(
        (sum, d) => sum + d.carryForward,
        0
    );

    const netPayment = Math.max(totalAvailable - totalDeducted, 0);

    /* -----------------------------
       6️⃣ Response
    --------------------------------*/
    return res.json({
        success: true,
        driverData: {
            weeklyTotal,
            vatAmount,
            ctpTotal,
            totalAvailable,
            totalScheduledDeductions,
            totalDeducted,
            netPayment,
            deductions: deductionPreview,
            adjustmentFound:adjustments,
            loansFound:loans,
            totalCarryForward
        }
    });
}
