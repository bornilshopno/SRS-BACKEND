import { getCollection } from "../../utils/getCollection.js";
import { ObjectId } from "mongodb";


async function getThisCollection() {
    return await getCollection("loans");
}

/* --------------------------------------------------
   CREATE (Insert Loan)
-----------------------------------------------------*/
export async function createLoanService(payload) {
    const collection = await getThisCollection();
const data={...payload,createdAt:Date.now() }
    const result = await collection.insertOne(data);
    console.log(result)
    return {insertedId:result.insertedId, createdLoan: data, success:true}
}

/* --------------------------------------------------
   Get Loans or Loan by ID 
-----------------------------------------------------*/
// const query = { driverId: new ObjectId(id) };

// export async function getLoanService(id) {
//     const collection = await getThisCollection();
//     if (id) {
//                 const query = { driverId: id };
//         const loan=await collection.findOne(query)
//         return loan
//     }
//     const loans = await collection.find().toArray();
//     return loans;
// }




export async function getLoanService(id) {
  const collection = await getThisCollection();

  const pipeline = [];

  // If specific driverId is provided
  if (id) {
    pipeline.push({
      $match: { driverId: id } // since driverId stored as string
    });
  }

  // Convert string IDs to ObjectId for lookup
  pipeline.push(
    {
      $addFields: {
        driverObjectId: { $toObjectId: "$driverId" },
        updatedByObjectId: { $toObjectId: "$updatedBy" }
      }
    },

    // Lookup loanee (driver)
    {
      $lookup: {
        from: "users",
        localField: "driverObjectId",
        foreignField: "_id",
        as: "loanee"
      }
    },
    {
      $unwind: {
        path: "$loanee",
        preserveNullAndEmptyArrays: true
      }
    },

    // Lookup updatedBy user
    {
      $lookup: {
        from: "users",
        localField: "updatedByObjectId",
        foreignField: "_id",
        as: "updatedByUser"
      }
    },
    {
      $unwind: {
        path: "$updatedByUser",
        preserveNullAndEmptyArrays: true
      }
    },

    // Final projection
    {
      $project: {
        _id: 1,
        driverId: 1,
        loanAmount: 1,
        installmentAmount: 1,
        reason: 1,
        startYear: 1,
        startWeek: 1,
        totalAmount: 1,
        type: 1,
        direction: 1,
        remaining: 1,
        status: 1,
        history: 1,
        createdAt: 1,

        // Loanee fields
        "loanee.name": 1,
        "loanee.email": 1,
        "loanee.srsDriverNumber": 1,
        "loanee.profileImage": 1,
        "loanee.site": 1,

        // UpdatedBy fields
        "updatedByUser.name": 1,
        "updatedByUser.email": 1,
        "updatedByUser.role": 1
      }
    },

    { $sort: { createdAt: -1 } }
  );

  const result = await collection.aggregate(pipeline).toArray();

  // If single driver requested → return array of loans for that driver
  return result;
}

// {
//   _id,
//   driverId,

//   loanRef: "LN-2025-0041",
//   principalAmount: 1000,
//   remainingAmount: 1000,

//   weeklyInstallment: 100,
//   totalInstallments: 10,

//   startWeek: 28,
//   startYear: 2025,

//   status: "ACTIVE" | "COMPLETED" | "PAUSED",

//   createdBy: adminId,
//   createdAt: Date,

//   history: [
//     {
//       week: 28,
//       year: 2025,
//       amount: 100,
//       deductedAt: Date
//     }
//   ]
// }