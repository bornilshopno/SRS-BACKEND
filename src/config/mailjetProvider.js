// src/providers/mailjet.provider.mjs

import Mailjet from 'node-mailjet'

const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_SECRET_KEY
)

/**
 * Send invoice email with PDF attachment
 * (ESM / type: module compatible)
 */
export const sendInvoiceEmail = async ({
  to,
  subject,
  html,
  pdfBuffer,
  filename
}) => {
  const request = mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: {
          Email: process.env.MAIL_FROM_EMAIL,
          Name: process.env.MAIL_FROM_NAME
        },
        To: [
          {
            Email: to
          }
        ],
        Subject: subject,
        HTMLPart: html,
        Attachments: [
          {
            ContentType: 'application/pdf',
            Filename: filename || 'invoice.pdf',
            Base64Content: pdfBuffer.toString('base64')
          }
        ]
      }
    ]
  })

  return request
}
