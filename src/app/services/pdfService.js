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
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`)
      doc.text(`Customer: ${invoice.customerName}`)
      doc.text(`Email: ${invoice.email}`)
      doc.moveDown()

      doc.text('Items:')
      doc.moveDown(0.5)

      invoice.items.forEach((item, index) => {
        doc.text(
          `${index + 1}. ${item.name} - ${item.quantity} x ${item.price} = ${item.quantity * item.price}`
        )
      })

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
