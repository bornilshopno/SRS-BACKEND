import { getCollection } from '../../../utils/getCollection.js';
import { ObjectId } from "mongodb";

async function getInvoiceCollection() {
  return await getCollection("invoices");
}

async function getDriverCollection() {
  return await getCollection("users");
}


export const generateDeductionData = async (
  fromYear,
  toYear,
  fromWeek,
  toWeek,
  deductionType = "all"
) => {
  const invoiceCollection = await getInvoiceCollection();

  let query;

  if (fromYear === toYear) {
    query = {
      year: Number(fromYear),
      week: {
        $gte: Number(fromWeek),
        $lte: Number(toWeek),
      },
    };
  } else {
    query = {
      $or: [
        {
          year: Number(fromYear),
          week: { $gte: Number(fromWeek) },
        },
        {
          year: Number(toYear),
          week: { $lte: Number(toWeek) },
        },
      ],
    };
  }

  const invoices = await invoiceCollection.find(query).sort({ year: 1, week: 1 }).toArray();

  // ✅ WEEKLY DATA
  const weeklyData = invoices.map((invoice) => {
    const drivers = invoice.driverWiseInvoiceData || [];

    const result = drivers.reduce(
      (acc, driver) => {
        // 🔹 Base totals
        acc.totalInvoiceAmount += driver.summary?.netPayment || 0;
        acc.totalEarnings += driver.summary?.totalEarnings || 0;
        acc.totalScheduledDeductions += driver.summary?.totalScheduledDeductions || 0;
        acc.totalDeducted += driver.summary?.totalDeducted || 0;
        acc.totalCarryFwd += driver.summary?.totalCarryForward || 0;

        acc.totalServiceAmount += driver.earnings?.weeklyTotal || 0;
        acc.totalVatAmount += driver.earnings?.vatAmount || 0;
        acc.totalCTPCharges += driver.earnings?.ctpPayment || 0;

        // 🔥 Deduction filtering logic
        if (deductionType === "all") {
          acc.totalDeductions += driver.summary?.totalDeducted || 0;

          acc.totalDBSFee += driver.deductions?.dbsFee || 0;
          acc.totalLoanInstallment += driver.deductions?.loanInstalment || 0;
          acc.totalPenaltyFee += driver.deductions?.penaltyFee || 0;
        }

        if (deductionType === "LOAN") {
          const val = driver.deductions?.loanInstalment || 0;
          acc.totalLoanInstallment += val;
          acc.totalDeductions += val;
        }

        if (deductionType === "DBS") {
          const val = driver.deductions?.dbsFee || 0;
          acc.totalDBSFee += val;
          acc.totalDeductions += val;
        }

        if (deductionType === "PENALTY") {
          const val = driver.deductions?.penaltyFee || 0;
          acc.totalPenaltyFee += val;
          acc.totalDeductions += val;
        }

        return acc;
      },
      {
        totalInvoiceAmount: 0,
        totalEarnings: 0,
        totalDeductions: 0,
        totalServiceAmount: 0,
        totalVatAmount: 0,
        totalCTPCharges: 0,
        totalDBSFee: 0,
        totalLoanInstallment: 0,
        totalPenaltyFee: 0,
        totalCarryFwd: 0,
        totalScheduledDeductions:0,
      }
    );

    return {
      year: invoice.year,
      week: invoice.week,
      ...result,
    };
  });

  // ✅ GRAND TOTALS
  const grandTotals = weeklyData.reduce(
    (acc, week) => {
      acc.totalInvoiceAmount += week.totalInvoiceAmount;
      acc.totalEarnings += week.totalEarnings;
      acc.totalDeductions += week.totalDeductions;

      acc.totalServiceAmount += week.totalServiceAmount;
      acc.totalVatAmount += week.totalVatAmount;
      acc.totalCTPCharges += week.totalCTPCharges;

      acc.totalDBSFee += week.totalDBSFee;
      acc.totalLoanInstallment += week.totalLoanInstallment;
      acc.totalPenaltyFee += week.totalPenaltyFee;

      acc.totalCarryFwd += week.totalCarryFwd;

      return acc;
    },
    {
      totalInvoiceAmount: 0,
      totalEarnings: 0,
      totalDeductions: 0,
      totalServiceAmount: 0,
      totalVatAmount: 0,
      totalCTPCharges: 0,
      totalDBSFee: 0,
      totalLoanInstallment: 0,
      totalPenaltyFee: 0,
      totalCarryFwd: 0,
    }
  );

  return {
    weeklyData,
    grandTotals,
  };
};

export const generateInvoiceReport = async (
  fromYear,
  toYear,
  fromWeek,
  toWeek,
  site = "all"
) => {
  const invoiceCollection = await getInvoiceCollection();

  let matchStage;

  if (fromYear === toYear) {
    matchStage = {
      year: Number(fromYear),
      week: {
        $gte: Number(fromWeek),
        $lte: Number(toWeek),
      },
    };
  } else {
    matchStage = {
      $or: [
        {
          year: Number(fromYear),
          week: { $gte: Number(fromWeek) },
        },
        {
          year: Number(toYear),
          week: { $lte: Number(toWeek) },
        },
      ],
    };
  }

  const pipeline = [
    // ✅ Step 1: Filter invoices
    { $match: matchStage },

    // ✅ Step 2: Unwind drivers
    {
      $unwind: {
        path: "$driverWiseInvoiceData",
        preserveNullAndEmptyArrays: false,
      },
    },

    // ✅ Step 3: Convert driverId → ObjectId
    {
      $addFields: {
        driverObjectId: {
          $toObjectId: "$driverWiseInvoiceData.driverId",
        },
      },
    },

    // ✅ Step 4: Lookup users
    {
      $lookup: {
        from: "users",
        localField: "driverObjectId",
        foreignField: "_id",
        as: "driverInfo",
      },
    },

    { $unwind: "$driverInfo" },

    // ✅ Step 5: Optional site filter
    ...(site !== "all"
      ? [
          {
            $match: {
              "driverInfo.site": {
                $regex: `^${site}$`,
                $options: "i", // case-insensitive
              },
            },
          },
        ]
      : []),

    // ✅ Step 6: Group by year + week
    {
      $group: {
        _id: {
          year: "$year",
          week: "$week",
        },

        totalInvoiceAmount: {
          $sum: "$driverWiseInvoiceData.summary.netPayment",
        },
        totalEarnings: {
          $sum: "$driverWiseInvoiceData.summary.totalEarnings",
        },
        totalScheduledDeductions: {
          $sum: "$driverWiseInvoiceData.summary.totalScheduledDeductions",
        },
        totalDeducted: {
          $sum: "$driverWiseInvoiceData.summary.totalDeducted",
        },
        totalCarryFwd: {
          $sum: "$driverWiseInvoiceData.summary.totalCarryForward",
        },

        totalServiceAmount: {
          $sum: "$driverWiseInvoiceData.earnings.weeklyTotal",
        },
        totalVatAmount: {
          $sum: "$driverWiseInvoiceData.earnings.vatAmount",
        },
        totalCTPCharges: {
          $sum: "$driverWiseInvoiceData.earnings.ctpPayment",
        },
      },
    },

    // ✅ Step 7: Sort properly
    {
      $sort: {
        "_id.year": 1,
        "_id.week": 1,
      },
    },

    // ✅ Step 8: Reshape weekly data
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        week: "$_id.week",
        totalInvoiceAmount: 1,
        totalEarnings: 1,
        totalScheduledDeductions: 1,
        totalDeducted: 1,
        totalCarryFwd: 1,
        totalServiceAmount: 1,
        totalVatAmount: 1,
        totalCTPCharges: 1,
      },
    },

    // ✅ Step 9: Final grouping (weeklyData + grandTotals)
    {
      $group: {
        _id: null,
        weeklyData: { $push: "$$ROOT" },

        grandTotals: {
          $sum: {
            totalInvoiceAmount: "$totalInvoiceAmount",
          },
        },

        totalInvoiceAmount: { $sum: "$totalInvoiceAmount" },
        totalEarnings: { $sum: "$totalEarnings" },
        totalScheduledDeductions: { $sum: "$totalScheduledDeductions" },
        totalDeducted: { $sum: "$totalDeducted" },
        totalCarryFwd: { $sum: "$totalCarryFwd" },
        totalServiceAmount: { $sum: "$totalServiceAmount" },
        totalVatAmount: { $sum: "$totalVatAmount" },
        totalCTPCharges: { $sum: "$totalCTPCharges" },
      },
    },

    // ✅ Step 10: Final shape
    {
      $project: {
        _id: 0,
        weeklyData: 1,
        grandTotals: {
          totalInvoiceAmount: "$totalInvoiceAmount",
          totalEarnings: "$totalEarnings",
          totalScheduledDeductions: "$totalScheduledDeductions",
          totalDeducted: "$totalDeducted",
          totalCarryFwd: "$totalCarryFwd",
          totalServiceAmount: "$totalServiceAmount",
          totalVatAmount: "$totalVatAmount",
          totalCTPCharges: "$totalCTPCharges",
        },
      },
    },
  ];

  const result = await invoiceCollection.aggregate(pipeline).toArray();

  return result[0] || { weeklyData: [], grandTotals: {} };
};