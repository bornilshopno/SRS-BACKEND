// src/services/email.service.mjs

import { sendInvoiceEmail as sendMailjetInvoice } from '../../config/mailjetProvider.js'
// import { sendInvoiceEmail as sendSesInvoice } from '../providers/ses.provider.mjs' // later

/**
 * Provider-agnostic email service
 * DO NOT put provider-specific logic outside this file
 * This file will NOT change when switching providers
 */

const PROVIDERS = {
  mailjet: sendMailjetInvoice
  // ses: sendSesInvoice
}

/**
 * Send invoice email (PDF attachment)
 * @param {Object} payload
 * @param {string} payload.to
 * @param {string} payload.subject
 * @param {string} payload.html
 * @param {Buffer} payload.pdfBuffer
 * @param {string} payload.filename
 */
export const sendInvoiceEmail = async (payload) => {
  const provider = process.env.EMAIL_PROVIDER || 'mailjet'

  const sendFn = PROVIDERS[provider]

  if (!sendFn) {
    throw new Error(`Email provider not supported: ${provider}`)
  }

  return sendFn(payload)
}
