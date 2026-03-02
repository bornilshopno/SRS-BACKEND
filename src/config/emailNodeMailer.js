import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

export const sendEmailByBrevo = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: '"SRS Driver App" <noreply@srsdriverapp.com>',
      to,
      subject,
      html,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Email error:", error);
  }
};

export const sendInvoiceEmailByBrevo = async ({
  to,
  subject,
  html,
  pdfBuffer,
  filename,
}) => {
  try {
    await transporter.sendMail({
      from: `"SRS Driver App" <noreply@srsdriverapp.com>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer, // this must be a Buffer
          contentType: "application/pdf",
        },
      ],
    });

    console.log("Invoice email sent to:", to);
  } catch (error) {
    console.error("Brevo email error:", error);
    throw error;
  }
};