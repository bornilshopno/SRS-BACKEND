import fs from "fs";
import path from "path";
import { ObjectId } from "mongodb";
import { getCollection } from "../../../utils/getCollection.js";


const BASE_FOLDER = path.join(process.cwd(), "fileUploads");

export const userFileDeleteService = async (filePath) => {
    try {
        if (!filePath) {
            return;
        }
        const safePath = filePath.startsWith("/")
            ? filePath.slice(1)
            : filePath;


        // Convert to absolute path
        const fullPath = path.join(process.cwd(), safePath);
        // Check if file exists
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            // console.log("fileDeleted", filePath)
            return ({
                file_delete: true,
            });
        } else {
            //    console.log("fileNotFOund Deleted", filePath)
            return ({
                file_delete: "File not found",
            });
        }
    } catch (error) {
        console.error(error);
        return ({
            file_delete: "Error deleting file",
        });
    }
}



export const getFilePath = (filename) => {
    console.log(filename)
    return path.join(process.cwd(), "fileUploads", filename);
};

//local❌❌❌❌❌❌

export const getFilePathLocal = (filename, showId, userId) => {
    console.log("from Service", filename, showId)
    if (showId) {
        return path.join(process.cwd(), `fileUploads/${userId}`, filename);
    }
    return path.join(process.cwd(), "fileUploads", filename);
};



//file to subfolder ⚠️

export const moveSingleUserFile = async ({ userId, key, fileName }) => {
    // 1. Build paths
    const sourcePath = path.join(BASE_FOLDER, fileName);
    const userFolder = path.join(BASE_FOLDER, userId);
    const destinationPath = path.join(userFolder, fileName);

    const oldDbPath = `/fileUploads/${fileName}`;
    const newDbPath = `/fileUploads/${userId}/${fileName}`;

    // 2. Validate source file exists
    if (!fs.existsSync(sourcePath)) {
        throw new Error("Source file not found");
    }

    // 3. Ensure user folder exists
    if (!fs.existsSync(userFolder)) {
        fs.mkdirSync(userFolder, { recursive: true });
    }

    // 4. Move file
    await fs.promises.rename(sourcePath, destinationPath);

    // 5. Update DB
    const usersCollection = await getCollection("users");

    const updateResult = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        {
            $set: {
                [key]: newDbPath,
            },
        }
    );

    if (updateResult.matchedCount === 0) {
        throw new Error("User not found");
    }

    return {
        oldPath: oldDbPath,
        newPath: newDbPath,
        updatedField: key,
    };
};

//multiple files to subfolder ⚠️
export const moveMultipleUserFiles = async ({
    userId,
    key,
    filenames, isOtherDocument,
}) => {

    // console.log("userId : ",userId,"key:",key,"fileNames :", filenames, "otherDocuments :", isOtherDocument)

    const usersCollection = await getCollection("users");

    const userFolder = path.join(BASE_FOLDER, userId);

    // 1. Ensure user folder exists
    await fs.promises.mkdir(userFolder, { recursive: true });

    const moveResults = [];

    // 2. Move files (parallel for performance)
    await Promise.all(
        filenames.map(async (fileName) => {
            const sourcePath = path.join(BASE_FOLDER, fileName);
            const destinationPath = path.join(userFolder, fileName);

            // Validate file exists
            if (!fs.existsSync(sourcePath)) {
                throw new Error(`File not found: ${fileName}`);
            }

            // Move file
            await fs.promises.rename(sourcePath, destinationPath);

            moveResults.push({
                oldPath: `/fileUploads/${fileName}`,
                newPath: `/fileUploads/${userId}/${fileName}`,
            });
        })
    );

    // 3. Prepare updated DB array
    const newPaths = filenames.map(
        (fileName) => `/fileUploads/${userId}/${fileName}`
    );

    // 4. Update DB field
    const updateField = isOtherDocument
        ? `otherDocuments.${key}`
        : key;

    const updateResult = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        {
            $set: {
                [updateField]: newPaths,
            },
        }
    );

    if (updateResult.matchedCount === 0) {
        throw new Error("User not found");
    }

    return {
        updatedField: key,
        files: moveResults,
    };
};