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