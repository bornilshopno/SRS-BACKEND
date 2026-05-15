
import fs from "fs";
import { createSignedToken, verifySignedToken } from "../../middleware/signedUrl.js";
import { getFilePath, getFilePathLocal, moveMultipleUserFiles, moveSingleUserFile } from "../services/fileService/fileService.js";
import { saveOtherDocumentsToUser } from "../services/userService.js";

export async function uploadMultipleFiles(req, res) {
  try {
    const id = req.params.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // parse meta
    const meta = JSON.parse(req.body.meta);

    // combine file + docType
    const combined = req.files.map((file, index) => {
      const docType = meta[index]?.docType;

      return {
        fileUrl: `/fileUploads/${id}/${file.filename}`,
        docKey: docType.toLowerCase().replace(/\s+/g, ""),
      };
    });

    // console.log("Combined files", combined)
    //   Output:  Combined files [
    //   {
    //     fileUrl: '/fileUploads/1775671258499-invoice-6963c539cdf294e99a46632e-2025-W01(7).pdf',
    //     docKey: 'first'
    //   },
    //   {
    //     fileUrl: '/fileUploads/1775671258500-invoice-6963c539cdf294e99a46632e-2025-W01(7).pdf',
    //     docKey: 'second'
    //   },
    //   {
    //     fileUrl: '/fileUploads/1775671258500-invoice-6963c539cdf294e99a46632e-2025-W01(7).pdf',
    //     docKey: 'third'
    //   }
    // ]

    // 🔥 Save each file

    for (const item of combined) {
      await saveOtherDocumentsToUser(item.fileUrl, item.docKey, id);
    }

    res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      files: combined,
    });

  } catch (error) {
    console.error("❌ Upload failed:", error);
    res.status(500).json({ error: error.message });
  }
}



//file secuirity related--not checked finally 


// 🔐 Generate signed URL
export const generateFileUrl = (req, res) => {
  const filename = req.params.filename;

  const token = createSignedToken(filename, 60); // 10 min
  // console.log("token", token)
  const url = `${process.env.BASE_URL}/check-and-get/files/${filename}?token=${token}`;

  res.json({ url });
};



// 🖼 Serve file
export const serveFile = (req, res) => {
  const { filename } = req.params;
  const { token } = req.query;

  // console.log("fileName :", filename)
  //   console.log("token :", token)

  // validate token
  const isValid = verifySignedToken(token, filename);
  // console.log("isValid :", isValid)
  if (!isValid) {
    return res.status(403).send("Invalid or expired link");
  }


  const filePath = getFilePath(filename);
  // console.log("filepath from serverfile : ", filePath)
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  return res.sendFile(filePath);
};


//temporary❌❌❌❌
export const generateFileUrlLocal = (req, res) => {
  const pathName = req.query.filename;
  const paths = pathName.split("/")
  // console.log("controller generate", pathName, paths)
  let filename;
  paths.length === 1 ? filename = pathName : filename = paths[1]
  const id = paths.length === 1 ? "" : paths[0]
  // console.log("controller", filename)
  const token = createSignedToken(filename, 60); // 10 min

  let showId = true;
  if (paths.length === 1) { showId = false }

  // console.log("token", token)
  const url = `${process.env.BASE_URL}/check-and-get/local/files/${filename}?token=${token}&showId=${showId}&userId=${id}`;

  res.json({ url });
};


//temporary❌❌❌❌
// 🖼 Serve file
export const serveFileLocal = (req, res) => {
  const { filename } = req.params;
  const { token, showId, userId } = req.query;

  console.log("fileName :", filename)
  //   console.log("token :", token)

  // validate token
  const isValid = verifySignedToken(token, filename);
  // console.log("isValid :", isValid)
  if (!isValid) {
    return res.status(403).send("Invalid or expired link");
  }

  ///❌❌❌❌❌
  const filePath = getFilePathLocal(filename, showId, userId);
  // console.log("filepath from serverfile : ", filePath)
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  return res.sendFile(filePath);
};


//file to subfolder ⚠️
export const handleMoveSingleUserFile = async (req, res) => {
  try {
    const { userId, key, fileName } = req.body;

    if (!userId || !key || !fileName) {
      return res.status(400).json({
        message: "userId, key and fileName are required",
      });
    }

    const result = await moveSingleUserFile({ userId, key, fileName });

    return res.status(200).json({
      success: true,
      message: "File moved and DB updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Move single file error:", error);

    return res.status(500).json({
      message: error.message || "Something went wrong",
    });
  }
};


//multiple files to subfolder ⚠️
export const handleMoveMultipleUserFiles = async (req, res) => {
  try {
    const { userId, key, filenames, isOtherDocument } = req.body;
    // console.log("userId : ",userId,"key:",key,"fileNames :", filenames, "req,body", req.body)

    if (!userId || !key || !Array.isArray(filenames)) {
      return res.status(400).json({
        message: "userId, key and fileNames[] are required",
      });
    }

    const result = await moveMultipleUserFiles({
      userId,
      key,
      filenames,
      isOtherDocument,
    });

    return res.status(200).json({
      success: true,
      message: "Files moved and DB updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Move multiple files error:", error);

    return res.status(500).json({
      message: error.message || "Something went wrong",
    });
  }
};