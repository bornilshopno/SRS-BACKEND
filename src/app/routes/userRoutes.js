import express from "express";
import multer from "multer";
import { registerUser, fetchUserByEmail, uploadUserFile, updateUserPersonalInfo, updateUserResidenceInfo, fetchAllUsers, fetchUserById, createEmployee, isAdmin, isSrsUser, checkDuplicateAccountController, deleteEmployee, uploadFile, commonDuplicateFieldCheckController, fileRecycleController, updateRecyleFile, checkResetOption, getOverViewStats, } from "../controllers/userController.js";
import { fileUpload } from "../../utils/multerSetUp.js";
import { getLogInHistory, saveLogInController } from "../controllers/logInController.js";
import { uploadMultipleFiles } from "../controllers/fileController.js";
import { resetPasswordLimiter } from "../../middleware/rateLimiter.js";
import { verifyJWT } from "../../middleware/roles.js";



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
router.post("/fileUpload/:id", fileUpload.single("file"), uploadFile)
// POST /api/users/multipleFileUpload/:email
router.post(
  "/multipleFileUpload/:id",
  fileUpload.array("files"),
  uploadMultipleFiles
);
// POST /api/users/save-login
router.post("/save-login", saveLogInController)
//GET /api/users/log-book
router.get("/logins/log-book", getLogInHistory)

//PATCH (/api/users/deleteFile)
router.patch("/recycleFile/:id",fileRecycleController)

//PATCH (/api/users/deleteFile)
router.patch("/recycleFile/update/:id",updateRecyleFile)



//PATCH /api/users/userResidence/email
router.patch("/userResidence/:email", updateUserResidenceInfo);
// GET /api/users?search=john&role=admin&fromDate=2025-01-01&toDate=2025-11-14&sortBy=submittedAt
// router.get("/", verifyJWT, fetchAllUsers);
router.get("/", fetchAllUsers);


router.get("/stats/overview-stats", getOverViewStats )

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

// POST /api/users/user/reset-password/:email
router.post("/user/reset-password", resetPasswordLimiter, checkResetOption);

export default router;
