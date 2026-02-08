// src/controllers/sendInvoices.controller.mjs

import { logActivity } from '../services/activityService.js'
import { processInvoiceFinance, reviseInvoiceFinance } from '../services/financeService.js'
import { processInvoices } from '../services/invoice.mailing.js'
import { updatePayrunInvoiceStatus } from '../services/invoice.payrun.adjustments.js'
import { createInvoiceData, createOrMergeInvoice, generateWeeklyInvoice, patchInvoiceData, reviseInvoiceData, sendEmailbyIdYearWeek } from '../services/invoiceService.js'
import { mailInvoices } from '../services/invoiceServices/mailService.js'
import { PatchWeeklyPayrunService } from '../services/payrunService.js'

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

export const reviseInvoice = async (req, res) => {
  const { year, week, driverWiseInvoiceData, activityDoc } = req.body;
  const updatedDriverInvoice = driverWiseInvoiceData[0];
  const dataForPayrun = { week, year, driverId: updatedDriverInvoice.driverId, updatedWeekData: updatedDriverInvoice.data.weekData }
  const dataForFinancialAdjustments = driverWiseInvoiceData[0].data.totalAdjusted;


  // console.log("from ReviseInvoice",updatedDriverInvoice, dataForFinancialAdjustments ) //okay


  if (!Array.isArray(driverWiseInvoiceData) || driverWiseInvoiceData.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Invoices array is required'
    })
  }

  try {
    const revisedInvoice = await reviseInvoiceData(week, year, updatedDriverInvoice)
    const invoiceDoc = { id: revisedInvoice.invoice._id, week, year, revision: updatedDriverInvoice.revision || 0 }
    const mailDoc=[revisedInvoice.invoice.driverWiseInvoiceData.find(d => d.driverId === updatedDriverInvoice.driverId)]
    //  console.log("from reviseInvoice", revisedInvoice,invoiceDoc) //okay
    const payrunResult = await PatchWeeklyPayrunService(dataForPayrun)
    // console.log("from reviseInvoice2= pay run result", payrunResult, )//okay
    const reviseAdjustments = await reviseInvoiceFinance(dataForFinancialAdjustments, invoiceDoc)
    // console.log("from reviseInvoice3", reviseAdjustments,"mailDoc", mailDoc, "invoiceDoc", invoiceDoc, "adjustments", dataForFinancialAdjustments)
    // console.log("from reviseInvoice3", reviseAdjustments, "mailDoc", mailDoc,)
    const mailingResult = await mailInvoices(mailDoc);//mail account suspended
    console.log("from reviseInvoice4", mailingResult)
    if (activityDoc) {
      try {
        await logActivity(activityDoc);
        // console.log("Activity logged successfully");//okay
      } catch (logError) {
        console.error("Failed to log activity (but user was updated):", logError);
      }
    }
    // console.log("from reviseInvoice", revisedInvoice, payrunResult, reviseAdjustments, mailingResult)//okay
    res.json({ success: true, revisedInvoice, payrunResult, reviseAdjustments, mailingResult });

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
    const result = await processInvoiceFinance(invoice._id);
    console.log("invoice controller, generate invoice", result)

    // 3️⃣ Payrun update (ONLY after finance success)
    await updatePayrunInvoiceStatus(driverWiseInvoiceData, week, year);//working

    // 4️⃣ Mail sending (ONLY after payrun)
    // await processInvoices(invoice.driverWiseInvoiceData);//mail accound suspended
    //when array coming one with it is sending all the drivers of the total invoice collection of that week. hence
    await processInvoices(driverWiseInvoiceData); //commented because mailjet problem
    res.json({ success: true });

  } catch (error) {
    console.error("Invoice pipeline failed", error);
    res.status(500).json({
      success: false,
      message: "Invoice processing failed safely"
    });
  }
};