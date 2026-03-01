import multer from "multer";
import path from "path";
import fs from "fs";

//Multer Configuration
// Ensure uploads folder exists
const uploadDir = path.join(process.cwd(), "fileUploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName =
            Date.now() + "-" + file.originalname.replace(/\s+/g, "");
        cb(null, uniqueName);
    },
});

export const fileUpload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});