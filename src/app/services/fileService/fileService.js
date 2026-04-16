import fs from "fs";
import path from "path";


export const userFileDeleteService = async (filePath) => {
    try {
        if (!filePath) {
            return;
        }
        // Convert to absolute path
        const fullPath = path.join(process.cwd(), filePath);
        // Check if file exists
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log("fileDeleted", filePath)
            return ({
                file_delete: true,
            });
        } else {
            console.log("fileNotFOund Deleted", filePath)
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