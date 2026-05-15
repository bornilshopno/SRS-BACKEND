import multer from "multer";
import path from "path";
import fs from "fs";

//Multer Configuration
// Ensure uploads folder exists
const uploadDir = path.join(process.cwd(), "fileUploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

//main 

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, uploadDir);
//     },
//     filename: function (req, file, cb) {
//         const userId = req.body.userId || req.params.id || "no_Id"; // 👈 from frontend
//         const uniqueName =
//            userId+ "-" +Date.now() + "-" + file.originalname.replace(/\s+/g, "");
//         cb(null, uniqueName);
//     },
// });

//temporary
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const userId = req.params.id || "no_Id";
        const userDir = path.join(uploadDir, userId);
console.log("multer-userDir", userDir)
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }

        cb(null, userDir);
    },

    filename: function (req, file, cb) {
        const userId = req.params.id  || "no_Id";

        const ext = path.extname(file.originalname);

        const baseName = path.basename(file.originalname, ext)
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_-]/g, "");

        const uniqueName = `${userId}-${Date.now()}-${baseName}${ext}`;
console.log("from Multer", uniqueName)
        cb(null, uniqueName);
    },
});



export const fileUpload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});