// src/routes/invoice.routes.mjs

import express from 'express'
import { createInvoice, getWeeklyInvoices, sendInvoicesController } from '../controllers/invoiceController.js'

const router = express.Router()
//POST/api/invoices/send
router.post('/send', sendInvoicesController)

//POST/api/invoices/create
router.post('/create', createInvoice)

//GET/api/invoices/weeklyInvoice
router.get("/weeklyInvoice", getWeeklyInvoices)

export default router