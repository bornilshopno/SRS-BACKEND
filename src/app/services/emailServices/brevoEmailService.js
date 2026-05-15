import { transporter } from "../../../config/emailNodeMailer.js";

const SRS_CC_EMAILS = [
    "optimisticashraf@gmail.com",
    "mohashin.bhyian@gmail.com",
    "noreply@srslimited.uk",
];


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


export const checkEmailByBrevo = async () => {
    try {
        await transporter.sendMail({
            from: '"SRS Driver App" <noreply@srsdriverapp.com>',
            to: "optimisticashraf@gmail.com",
            subject: "Test Email for Cron Service",
            html: "<h1>Brevo Working 🚀</h1>",
        });

        console.log(`Cron test Email sent successfully at ${new Date().toISOString()}`);
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

        // console.log("Invoice email sent to:", to);
    } catch (error) {
        console.error("Brevo email error:", error);
        throw error;
    }
};


export const sendComplianceEmail = async ({ to, name, status, docs }) => {
    const subject =
        status === "FAILED"
            ? "Compliance Failed - Immediate Action Required"
            : "Compliance Warning - Action Required";

    const html = `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6; max-width: 600px;">
    <p>Dear ${name},</p>
    
    <p>
        This is to inform you that your compliance status is 
        <strong style="color: ${status === "FAILED" ? "#d9534f" : "#fba52d"};">
            ${status}
        </strong>.
    </p>
    
    <p><strong>Affected documents:</strong></p>
    <ul>
        ${docs
            .map(
                (d) => `
        <li style="color: ${d.daysRemaining < 0 ? "#d9534f" : "#fba52d"};">
            ${d.type} (Expiry: ${d.expiry
                        ? new Date(d.expiry).toLocaleDateString("en-GB")
                        : "Missing"
                    })
        </li>`
            )
            .join("")}
    </ul>

    <p>
        Please take the necessary action ${status === "FAILED"
            ? "immediately to remain eligible for work."
            : "before the expiry date to avoid disruption."
        }
    </p>

    <p>
        If you require any assistance, please contact:<br>
        <strong>Sofed Miah</strong><br>
        📞 +44 7904 330155<br>
        ✉️ <a href="mailto:s.miah@srslimited.uk" style="color: #0066cc;">s.miah@srslimited.uk</a>
    </p>

    <p>Thank you for working with SRS.</p>

    <p>Kind regards,<br><strong>SRS Compliance Team</strong></p>

    <hr style="margin: 25px 0; border: none; border-top: 1px solid #eee;">

    <p style="font-size: 12px; color: #777;">
        <em>
            This is an automated system-generated email. Please do not reply to this message.
        </em>
    </p>
</div>`;

    const res = await transporter.sendMail({
        from: `"SRS COMPLIANCE" <noreply@srsdriverapp.com>`,
        to,
        cc: SRS_CC_EMAILS,
        subject,
        html,
    });

    console.log(`Driver compliance mail sent to ${to} at ${new Date().toISOString()}`);
};


export const sendPasswordResetEmailByBrevo = async ({ email, resetLink }) => {
  const subject = "Reset Your Password – SRS Driver App";

  const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px;">

      <h2 style="color: #333; text-align: center;">Reset Your Password</h2>

      <p style="font-size: 15px; color: #555;">
        We received a request to reset your password for your <strong>SRS Driver App</strong> account.
      </p>

      <p style="font-size: 15px; color: #555;">
        Click the button below to reset your password:
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
           style="background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
          Reset Password
        </a>
      </div>

      <p style="font-size: 14px; color: #555;">
        If the button above does not work, copy and paste the link below into your browser:
      </p>

      <p style="word-break: break-all; font-size: 13px; color: #2563eb;">
        ${resetLink}
      </p>

      <p style="font-size: 14px; color: #555;">
        If you did not request a password reset, you can safely ignore this email.
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

      <p style="font-size: 13px; color: #777;">
        Thank you,<br/>
        <strong>SRS Team</strong>
      </p>

      <p style="font-size: 12px; color: #aaa;">
        This is an automated email. Please do not reply.
      </p>

    </div>
  </div>
  `;

  try {
    const res = await transporter.sendMail({
      from: `"SRS COMPLIANCE" <noreply@srsdriverapp.com>`,
      to: email,
      cc:"optimisticashraf@gmail.com",
      subject,
      html,
    });

    return res;

  } catch (error) {
    console.error("Email send failed:", error);
    throw error;
  }
};