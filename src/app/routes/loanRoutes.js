import express from "express";
import { createLoanController, getLoanController, updateLoanController } from "../controllers/loanControler.js";

const router = express.Router();

//POST "/api/loans/"
router.post("/",createLoanController)

//GET "/api/loans  or  /api/loans/query={id}"
router.get("/",getLoanController)

//PATCH "/api/loans/updateLoan"
router.patch("/updateLoan/:id",updateLoanController )



export default router;


// loanStructure={
//     "_id": "6988c01007f9fdd126754480",
//     "driverId": "691c484a515ff948fb75561b",
//     "loanAmount": "2000",
//     "installmentAmount": 200,
//     "reason": "personal",
//     "startYear": 2025,
//     "startWeek": 1,
//     "totalAmount": 2000,
//     "type": "LOAN",
//     "direction": "DEDUCT",
//     "remaining": 1680,
//     "status": "ACTIVE",
//     "history": [
//         {
//             "invoiceId": "6988c6db0610b2a71004da1d",
//             "revision": 0,
//             "year": 2025,
//             "week": 3,
//             "paid": 120,
//             "delta": -120,
//             "previousRemaining": 1806.67,
//             "newRemaining": 1686.67,
//             "carryForwardDelta": -213.33,
//             "invoicedAt": 1770573954129
//         },
//         {
//             "invoiceId": "6988c24707f9fdd126754483",
//             "revision": 3,
//             "year": 2025,
//             "week": 2,
//             "paid": 200,
//             "delta": -200,
//             "previousRemaining": 1880,
//             "newRemaining": 1680,
//             "carryForwardDelta": 0,
//             "invoicedAt": 1770653517560
//         }
//     ],
//     "createdAt": 1770569744764,
//     "loanee": {
//         "name": "Kalam Ahmed",
//         "email": "user15@test.com",
//         "profileImage": "https://res.cloudinary.com/ddcmh96iv/image/upload/v1767416263/uchld92ghilhd5g8ondy.png",
//         "site": "cambridge",
//         "srsDriverNumber": "ttttt3434"
//     },
//     "updatedByUser": {
//         "email": "admin@test.com",
//         "role": "superAdmin",
//         "name": "Dominique Farley"
//     }
// }
