import { ObjectId } from "mongodb";
import { getCollection } from "../../utils/getCollection.js";
// import { sendInvoiceEmail } from "./emailService.js";
import { generateInvoicePdf } from "./pdfService.js";
import { sendInvoiceEmailByBrevo } from "../../config/emailNodeMailer.js";


async function getDriverCollection() {
    return await getCollection("users");
}

export const processInvoices = async (invoices = []) => {
    const results = {
        total: invoices.length,
        sent: 0,
        failed: 0,
        details: []
    }

    for (const invoice of invoices) {
        try {

            const driverCollection = await getDriverCollection();
            const driverInfo = await driverCollection.findOne({ _id: new ObjectId(invoice.driverId) });
            const driver = {
                name: driverInfo.name,
                niNumber: driverInfo.nationalInsuranceNumber,
                address: driverInfo.address,
                vatNumber: driverInfo.vatNumber,
            }


            const pdfBuffer = await generateInvoicePdf({ ...invoice, ...driver })

            await sendInvoiceEmailByBrevo({
                to: invoice.email,
                subject: `Invoice ${invoice.reference}`,
                // html: `<p>Dear ${driver.name},</p><p>Please find your invoice attached.</p>`,
                html: `
  <div style="font-family: Arial, sans-serif;">
  
    <p>Dear ${driver.name},</p>
    <p>Please find your invoice attached.</p>
    <p>Thank you for working with SRS.</p>
  </div>
`,
                pdfBuffer,
                filename: `invoice-${invoice.reference}.pdf`
            })

            results.sent++
            results.details.push({
                invoiceNumber: invoice.reference,
                status: 'sent'
            })
        } catch (error) {
            results.failed++
            results.details.push({
                invoiceNumber: invoice?.reference,
                status: 'failed',
                error: error.message
            })
        }
    }
    console.log("invoice mailing", results)
    return results
}