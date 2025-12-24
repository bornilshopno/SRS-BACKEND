import { getCollection } from "../../utils/getCollection.js";



async function getThisCollection() {
    return await getCollection("loans");
}

/* --------------------------------------------------
   CREATE (Insert Loan)
-----------------------------------------------------*/
export async function createLoanService(payload) {
    const collection = await getThisCollection();
const data={...payload,history:[],loanCreatedAt:Date.now() }
    const result = await collection.insertOne(data);
    console.log(result)
    return {insertedId:result.insertedId, createdLoan: data, success:true}
}

/* --------------------------------------------------
   Get Loans or Loan by ID 
-----------------------------------------------------*/
export async function getLoanService(id) {
    const collection = await getThisCollection();
    if (id) {
        // const query = { driverId: new ObjectId(id) };
        const query = { driverId: id };
        const loan=await collection.findOne(query)
        return loan
    }
    const loans = await collection.find().toArray();
    return loans;
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