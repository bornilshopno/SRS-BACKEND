// src/controllers/sendInvoices.controller.mjs

import { logActivity } from '../services/activityService.js'
import { createInvoiceData, generateWeeklyInvoice, patchInvoiceData, processInvoices, sendEmailbyIdYearWeek } from '../services/invoiceService.js'

export const sendInvoicesController = async (req, res) => {
  try {
    const { invoices } = req.body

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoices array is required'
      })
    }

    const result = await processInvoices(invoices)

    res.status(200).json({
      success: true,
      result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}


export const createInvoice = async (req, res) => {
  try {
    const { week, year, driverWiseInvoiceData } = req.body

    if (!Array.isArray(driverWiseInvoiceData) || driverWiseInvoiceData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoices array is required'
      })
    }

    const result = await createInvoiceData(week, year, driverWiseInvoiceData)

    res.status(200).json({
      success: true,
      result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }

}


export const getWeeklyInvoices = async (req, res) => {
  try {
    const { year, week, driverId } = req.query;


    const doc = await generateWeeklyInvoice(year, week, driverId);

    // Just return whatever getWeekService returns
    // → null if week doesn't exist
    // → full doc if no site param
    // → site-specific object if site is provided
    return res.status(200).json(doc);  // Always 200

  } catch (err) {
    console.error('getWeeklyInvoices:', err);
    return res.status(500).json({ message: err?.message || "Server error" });
  }

}


export const sendIndividualInvoice = async (req, res) => {
  try {
    const { driverWiseInvoiceData } = req.body

    if (!Array.isArray(driverWiseInvoiceData) || driverWiseInvoiceData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoices array is required'
      })
    }

    const result = await processInvoices(driverWiseInvoiceData)

    res.status(200).json({
      success: true,
      result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }

}

export const sendEmailbyIdYearWeekController = async (req, res) => {
  try {
    const result = await sendEmailbyIdYearWeek(req.body)
    res.status(200).json({
      success: true,
      result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }



}

export const patchWeeklyInvoice= async(req,res)=>{

  const {year,week, driverWiseInvoiceData, activityDoc}=req.body
    try {


    if (!Array.isArray(driverWiseInvoiceData) || driverWiseInvoiceData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoices array is required'
      })
    }

    const result = await patchInvoiceData(week, year, driverWiseInvoiceData)
       if (activityDoc) {
               try {
                   await logActivity(activityDoc);
                   console.log("Activity logged successfully");
               } catch (logError) {
                   console.error("Failed to log activity (but user was updated):", logError);
                   // We don't fail the whole request just because logging failed
               }
           }

    res.status(200).json({
      success: true,
      result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }

}