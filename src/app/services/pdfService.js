import PDFDocument from "pdfkit";

export const generateInvoicePdf = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });

      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      const pageWidth = 545;
      const startX = 50;

      /* ================= HEADER ================= */

      doc.font("Helvetica-Bold").fontSize(14).text("SRS LOGISTICS AND STORAGE LTD");
      doc.fontSize(10).font("Helvetica").text(
        `Unit 12 Farringdon Grove
Farringdon Avenue
Romford
RM3 8TD`
      );

      doc.moveDown(0.5);
      doc.text("Company VAT no: 321 6802 29");
      doc.text("Company Registration: 11762532");

      drawLine(doc);

      /* ================= META ================= */

      doc.moveDown();
      doc.text(`Invoice date: ${formatDate(Date.now())}`);
      doc.text(`Bill pay date: ${formatDate(Date.now() + 7 * 86400000)}`);

      doc.moveDown();
      doc.font("Helvetica-Bold").text(`Name: ${invoice.name}`);
      doc.font("Helvetica").text(`NI Number: ${invoice.niNumber}`);
      doc.text(`Address: ${invoice.address}`);
      doc.text(`VAT number: ${invoice.vatNumber || "N/A"}`);

      // doc.moveDown(0.5);
      drawLine(doc);
      doc.moveDown();
      /* ================= TABLE ================= */

      const col = {
        day: 50,
        date: 90,
        desc: 190,
        amount: 450,
      };

      const rowHeight = 22;
      /* -------- Title -------- */
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Service Amount Breakdown :", 50);
      // drawLine(doc);

      // doc.moveDown(0.5);
      // Header row
      const headerY = doc.y + 5;

      // background
      doc
        .rect(50, headerY, 495, rowHeight)
        .fill("#f3f4f6"); // gray-100

      drawTableRowBorder(doc, headerY, rowHeight);

      doc.fillColor("black").font("Helvetica-Bold").fontSize(8);
      drawTableRowBorder(doc, headerY, rowHeight);

      doc.font("Helvetica-Bold").fontSize(10);
      doc.text("Day", col.day, headerY + 6);
      doc.text("Date", col.date, headerY + 6);
      doc.text("Description", col.desc, headerY + 6);
      doc.text("Amount", col.amount, headerY + 6, {
        align: "right",
        width: 90,
      });

      doc.y = headerY + rowHeight;

      doc.font("Helvetica").fontSize(10);

      let totalServiceAmount = 0;

      invoice.data.weekData.forEach((day) => {
        if (!day.assignments?.length) return;

        if (doc.y > doc.page.height - 150) doc.addPage();

        const dayTotal = day.assignments.reduce(
          (sum, a) => sum + Number(a.rate || 0),
          0
        );

        totalServiceAmount += dayTotal;

        const rowY = doc.y;

        drawTableRowBorder(doc, rowY, rowHeight);

        doc.text(day.weekday.slice(0, 3), col.day, rowY + 6);
        doc.text(formatDate(day.date), col.date, rowY + 6);

        doc.text(
          day.assignments.map(a => a.detailRoute).join(", "),
          col.desc,
          rowY + 6,
          { width: 240 }
        );

        doc.text(`£ ${dayTotal.toFixed(2)}`, col.amount, rowY + 6, {
          align: "right",
          width: 90,
        });

        doc.y = rowY + rowHeight;
      });

      drawLine(doc);

      //
      /* ================= TABLE 2 : GROUPED ADJUSTMENTS ================= */

      if (invoice.data?.totalAdjusted?.length) {
        const adjustments = invoice.data.totalAdjusted;

        // Group by source
        const grouped = adjustments.reduce((acc, item) => {
          acc[item.source] = acc[item.source] || [];
          acc[item.source].push(item);
          return acc;
        }, {});

        // A4 width safe columns (margin 50)
        const col = {
          source: 50,
          ref: 120,
          base: 300,
          paid: 380,
          carry: 450,
        };

        const rowHeight = 18;

        doc.moveDown(1);

        if (doc.y > doc.page.height - 200) doc.addPage();

        /* -------- Title -------- */
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .text("Adjustments Summary :", 50);
        // drawLine(doc);
        // doc.moveDown(0.5);

        /* -------- Header (Gray Background) -------- */
        const headerY = doc.y;

        // background
        doc
          .rect(50, headerY, 495, rowHeight)
          .fill("#f3f4f6"); // gray-100

        drawTableRowBorder(doc, headerY, rowHeight);

        doc.fillColor("black").font("Helvetica-Bold").fontSize(8);

        doc.text("Source", col.source, headerY + 5);
        doc.text("Ref ID", col.ref, headerY + 5);
        doc.text("Base", col.base, headerY + 5, { width: 70, align: "right" });
        doc.text("Paid", col.paid, headerY + 5, { width: 60, align: "right" });
        doc.text("Carry Fwd", col.carry, headerY + 5, {
          width: 80,
          align: "right",
        });

        doc.y = headerY + rowHeight;
        doc.font("Helvetica").fontSize(8);

        /* -------- Grouped Rows -------- */
        Object.keys(grouped).forEach((source) => {
          if (doc.y > doc.page.height - 140) doc.addPage();

          // Group label row
          // doc
          //   .font("Helvetica-Bold")
          //   .fontSize(8)
          //   .text(source, 50);

          // doc.moveDown(0.2);
          // doc.font("Helvetica");

          grouped[source].forEach((adj) => {
            if (doc.y > doc.page.height - 120) doc.addPage();

            const rowY = doc.y;
            drawTableRowBorder(doc, rowY, rowHeight);

            doc.text(adj.source, col.source, rowY + 5);
            doc.text(adj.refId || "-", col.ref, rowY + 5, { width: 160 });

            doc.text(
              `£ ${Number(adj.baseInstallment || 0).toFixed(2)}`,
              col.base,
              rowY + 5,
              { width: 70, align: "right" }
            );

            doc.text(
              `£ ${Number(adj.paid || 0).toFixed(2)}`,
              col.paid,
              rowY + 5,
              { width: 60, align: "right" }
            );

            doc.text(
              `£ ${Number(adj.carryForward || 0).toFixed(2)}`,
              col.carry,
              rowY + 5,
              { width: 80, align: "right" }
            );

            doc.y = rowY + rowHeight;
          });

          // doc.moveDown(0.3);
        });

        drawLine(doc);
      }


      /* ================= TOTALS ================= */

      doc.moveDown();

      drawTotalRow(doc, "Total Service Amount", invoice.earnings.weeklyTotal);
      drawTotalRow(doc, "VAT Amount", invoice.earnings.vatAmount);
      drawTotalRow(doc, "CTP Payment", invoice.earnings.ctpPayment);
      drawTotalRow(doc, "Liability for this Week", invoice.summary.totalScheduledDeductions);
      drawTotalRow(doc, "Deducted This Week", invoice.summary.totalDeducted);
      drawTotalRow(doc, "Carry Forward to Next Week", invoice.summary.totalCarryForward);

      drawLine(doc);

      drawTotalRow(doc, "Grand Total", invoice.summary.netPayment, true);

      /* ================= FOOTER ================= */

      const footerY = doc.page.height - 100;

      doc.moveTo(startX, footerY).lineTo(pageWidth, footerY).stroke();

      doc.fontSize(9).font("Helvetica").text(
        "Generated by SRS Management System",
        startX,
        footerY + 10,
        { align: "center", width: 495 }
      );

      doc.text(
        `Printed on: ${new Date().toLocaleString()}`,
        startX,
        footerY + 25,
        { align: "center", width: 495 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/* ================= HELPERS ================= */

function drawLine(doc) {
  doc.moveDown(0.7);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.7);
}

function drawTableRowBorder(doc, y, height) {
  doc.rect(50, y, 495, height).stroke();
}

function drawTotalRow(doc, label, value, bold = false) {
  doc.font(bold ? "Helvetica-Bold" : "Helvetica");
  const y = doc.y;

  doc.text(label, 300, y);
  doc.text(`£ ${Number(value || 0).toFixed(2)}`, 50, y, {
    align: "right",
    width: 495,
  });

  doc.moveDown(0.8);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
