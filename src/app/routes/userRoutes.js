import express from "express";
import multer from "multer";
import { registerUser, loginUser, fetchUserByEmail, uploadUserFile, updateUserPersonalInfo, updateUserResidenceInfo, fetchAllUsers, fetchUserById, createEmployee, isAdmin, isSrsUser, checkDuplicateAccountController, deleteEmployee, uploadFile, commonDuplicateFieldCheckController, } from "../controllers/userController.js";
import { fileUpload } from "../../utils/multerSetUp.js";


const router = express.Router();

const upload = multer({ dest: "uploads/" });


//done
router.post("/register", registerUser);
// GET /api/users/:email//done
router.get("/:email", fetchUserByEmail);
// GET /api/users/user/:id//done
router.get("/user/:id", fetchUserById);
// POST /api/users/upload/:email
router.post("/upload/:email", upload.single("file"), uploadUserFile);
//PATCH /api/users/userPersonal/email
router.patch("/userPersonal/:email", updateUserPersonalInfo);
// POST /api/users/fileUpload/:email
router.post("/fileUpload/:email", fileUpload.single("file"), uploadFile)



//PATCH /api/users/userResidence/email
router.patch("/userResidence/:email", updateUserResidenceInfo);
// GET /api/users?search=john&role=admin&fromDate=2025-01-01&toDate=2025-11-14&sortBy=submittedAt
router.get("/", fetchAllUsers);
// router.post("/create-employee", verifyAdminOrSiteManager, createEmployee);
router.post("/employees", createEmployee)
// GET /api/users/admin/:email  → Check if a user is admin
router.get('/admin/:email', isAdmin);
// GET /api/users/admin/:email  → Check if a user is SRS user
router.get('/srs/:email', isSrsUser);
// GET /api/users/check-bank-account
// query: ?bankAccountNumber=12345678&excludeDriverId=abc123
router.get('/check/bank-account', checkDuplicateAccountController)

// GET /api/users/check-duplicate?field=bankAccountNumber&value=12345678
// GET /api/users/check-duplicate?field=srsDriverNumber&value=DR123
router.get('/check/duplicate', commonDuplicateFieldCheckController)

// DELETE /api/users/:email//done
router.delete("/:email", deleteEmployee);



router.post("/login", loginUser);

export default router;




//Multer Configuration
// Ensure uploads folder exists


// const uploadDir = path.join(process.cwd(), "fileUploads");
// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, uploadDir);
//     },
//     filename: function (req, file, cb) {
//         const uniqueName =
//             Date.now() + "-" + file.originalname.replace(/\s+/g, "");
//         cb(null, uniqueName);
//     },
// });

// export const fileUpload = multer({
//     storage,
//     limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
// });