// src/services/pdf.service.mjs

import PDFDocument from 'pdfkit'

/**
 * Generate invoice PDF in memory
 * NO file system usage
 * Returns Buffer
 */

/**
 * @param {Object} invoice
 * @returns {Promise<Buffer>}
 */
export const generateInvoicePdf = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })

      const buffers = []
      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers)
        resolve(pdfBuffer)
      })

      /* -------- PDF CONTENT -------- */

      doc.fontSize(20).text('INVOICE', { align: 'center' })
      doc.moveDown()

      doc.fontSize(12)
      doc.text(`Invoice Number: ${invoice.driverId}`)
      // doc.text(`Customer: ${invoice.customerName}`)
      doc.text(`Email: ${invoice.email}`)
      doc.moveDown()

      doc.text('Items:')
      doc.moveDown(0.5)

      doc.text(`Earning from Trip s: ${invoice.earnings.weeklyTotal}`, {align: 'right'})
      doc.text(`Vat Amount: ${invoice.earnings.vatAmount}`)
      doc.text(`CT Bill: ${invoice.earnings.ctpPayment}`)
      doc.text(`Total Payment(Earning+Vat+CT): ${invoice.summary.totalEarnings}`, {align: 'right'})
      doc.text(`Liability Scheduled: ${invoice.summary.totalScheduledDeductions}`)
      doc.text(`Liability Balanced: ${invoice.summary.totalDeducted}`)
      doc.text(`Liability Carried to Next Week: ${invoice.summary.totalCarryForward}`)
      doc.text(`Net Payable: ${invoice.summary.netPayment}`, {align: 'right'})



      doc.moveDown()
      doc.fontSize(14).text(`Total Amount: ${invoice.totalAmount}`, {
        align: 'right'
      })

      /* -------- END CONTENT -------- */

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
