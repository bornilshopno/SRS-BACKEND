

// services/invoice/invoice.extractor.js
export const extractAdjustments = (invoiceDoc) => {
  const list = [];

  for (const driver of invoiceDoc.driverWiseInvoiceData) {
    const { totalAdjusted = [] } = driver.data || {};

    for (const adj of totalAdjusted) {
      list.push({
        source: adj.source,
        refId: adj.refId,
        paid: adj.paid || 0,
        scheduled: adj.scheduled || 0,
        invoiceId: invoiceDoc._id.toString(),
        revision: driver.revision || 0,
        year: invoiceDoc.year,
        week: invoiceDoc.week
      });
    }
  }

  return list.filter(a => (a.paid !== 0 || a.scheduled !== 0));
};
