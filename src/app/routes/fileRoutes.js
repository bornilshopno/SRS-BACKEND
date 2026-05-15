import express from "express";
import { verifyAdmin, verifyDriver, verifyJWT, verifyManager } from "../../middleware/roles.js";
import { generateFileUrl, generateFileUrlLocal, handleMoveMultipleUserFiles, handleMoveSingleUserFile, serveFile, serveFileLocal } from "../controllers/fileController.js";



const router = express.Router();

// default gateway => /check-and-get

// 🔐 Step 1: generate signed URL
router.get("/file-url/:filename", verifyJWT, generateFileUrl);

//temporary❌❌❌❌
router.get("/local/file-url", verifyJWT, generateFileUrlLocal);

// 🔐 Step 1: generate signed URL
router.get("/documents/file-url/:filename", verifyJWT, generateFileUrl);

// 🖼 Step 2: serve file securely
router.get("/files/:filename", serveFile);

//temporary❌❌❌❌
// 🖼 Step 2: serve file securely
router.get("/local/files/:filename", serveFileLocal);


//moving one file to subfolder ⚠️⚠️⚠️
// (
//   "/check-and-get/move/single-file",
//   {
//     userId: "699e8ff1fe2aa4b2a2a45f82",
//     key: "profileImage",
//     fileName: "chobi.jpg",
//   },
//   { withCredentials: true }
// );
router.post("/move/single-file", verifyAdmin, handleMoveSingleUserFile)



//multiple files to subfolder ⚠️⚠️⚠️
// (
//   "/check-and-get/move/multiple-files",
//   {
//     userId: "699e8ff1fe2aa4b2a2a45f82",
//     key: "passport",
//     fileNames: ["page1.pdf", "page2.jpg"],
//     isOtherDocument:boolean
//   },
//   { withCredentials: true }
// );
router.post("/move/multiple-files", verifyAdmin, handleMoveMultipleUserFiles);

export default router;

// Get Signed Url =>
// Frontend → /check-and-get/file-url/:filename → Controller → Token created → URL returned
// Load Image => 
// Browser → /check-and-get/files/:filename?token=... → Controller → verify → sendFile

// previous <img src="/filefolder/image.png" />
// current 
// const res = await fetch(`/check-and-get/file-url/${filename}`, {
//   headers: {
//     Authorization: `Bearer ${token}`,
//   },
// });

// const data = await res.json();

// setImageUrl(data.url);