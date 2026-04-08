import { saveOtherDocumentsToUser } from "../services/userService";



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
                fileUrl: `/fileUploads/${file.filename}`,
                docKey: docType.toLowerCase().replace(/\s+/g, ""),
            };
        });

        console.log("Combined files", combined)
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
          await saveOtherDocumentsToUser(fileUrl, docKey, id);
        }

        res.status(200).json({
            message: "Files uploaded successfully",
            files: combined,
        });

    } catch (error) {
        console.error("❌ Upload failed:", error);
        res.status(500).json({ error: error.message });
    }
}
