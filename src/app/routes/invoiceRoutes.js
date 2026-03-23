// src/routes/invoice.routes.mjs

import express from 'express'
import { createInvoice, generateInvoice, getDeductionsByWeekRange, getInvoiceReportsByDateRange, getWeeklyInvoices, patchWeeklyInvoice, reviseInvoice, sendEmailbyIdYearWeekController, sendIndividualInvoice, sendInvoicesController } from '../controllers/invoiceController.js'

const router = express.Router()
//POST/api/invoices/send
router.post('/send', sendInvoicesController)

//POST/api/invoices/create
router.post('/create', createInvoice)


//POST/api/invoices/generate
router.post('/generate', generateInvoice)

//POST/api/invoices/reviseOne
router.patch('/weeklyInvoice/revise-one', reviseInvoice)

//PATCH/api/invoices/weeklyInvoice/reviseOne
router.patch("/weeklyInvoice/reviseOne", patchWeeklyInvoice )

//POST/api/invoices/sendEmail/individual
router.post('/sendEmail/individual', sendIndividualInvoice)

//POST/api/invoices/sendEmail/byIdYearWeek
router.post('/sendEmail/byIdYearWeek', sendEmailbyIdYearWeekController)

//GET/api/invoices/weeklyInvoice
router.get("/weeklyInvoice", getWeeklyInvoices)

//GET/api/invoices/deductions
router.get("/deductions",getDeductionsByWeekRange)

//GET/api/invoices/byDateRange
router.get("/byDateRange",getInvoiceReportsByDateRange)



export default router