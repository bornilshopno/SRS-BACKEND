// src/controllers/sendInvoices.controller.mjs

import { logActivity } from '../services/activityService.js'
import { processInvoiceFinance } from '../services/financeService.js'
import { processInvoices } from '../services/invoice.mailing.js'
import { updatePayrunInvoiceStatus } from '../services/invoice.payrun.adjustments.js'
import { createInvoiceData, createOrMergeInvoice, generateWeeklyInvoice, patchInvoiceData, sendEmailbyIdYearWeek } from '../services/invoiceService.js'

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

export const patchWeeklyInvoice = async (req, res) => {

  const { year, week, driverWiseInvoiceData, activityDoc } = req.body
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

export const generateInvoice = async (req, res) => {
  const { week, year, driverWiseInvoiceData } = req.body;

  try {
    // 1️⃣ Save invoice
    const invoice = await createOrMergeInvoice(
      week,
      year,
      driverWiseInvoiceData
    );
    // console.log("from processControler", invoice._id)//working

    // 2️⃣ Finance-grade adjustments
    await processInvoiceFinance(invoice._id);

    // 3️⃣ Payrun update (ONLY after finance success)
    await updatePayrunInvoiceStatus(driverWiseInvoiceData, week, year);//working

    // 4️⃣ Mail sending (ONLY after payrun)
    // await processInvoices(invoice.driverWiseInvoiceData);//mail accound suspended
    //when array coming one with it is sending all the drivers of the total invoice collection of that week. hence
    await processInvoices(driverWiseInvoiceData);
    res.json({ success: true });

  } catch (error) {
    console.error("Invoice pipeline failed", error);
    res.status(500).json({
      success: false,
      message: "Invoice processing failed safely"
    });
  }
};