// src/routes/invoice.routes.mjs

import express from 'express'
import { createInvoice, getWeeklyInvoices, patchWeeklyInvoice, sendEmailbyIdYearWeekController, sendIndividualInvoice, sendInvoicesController } from '../controllers/invoiceController.js'

const router = express.Router()
//POST/api/invoices/send
router.post('/send', sendInvoicesController)

//POST/api/invoices/create
router.post('/create', createInvoice)

//POST/api/invoices/sendEmail/individual
router.post('/sendEmail/individual', sendIndividualInvoice)

//POST/api/invoices/sendEmail/byIdYearWeek
router.post('/sendEmail/byIdYearWeek', sendEmailbyIdYearWeekController)

//GET/api/invoices/weeklyInvoice
router.get("/weeklyInvoice", getWeeklyInvoices)

//PATCH/api/invoices/weeklyInvoice/reviseOne
router.patch("/weeklyInvoice/reviseOne", patchWeeklyInvoice )

export default router