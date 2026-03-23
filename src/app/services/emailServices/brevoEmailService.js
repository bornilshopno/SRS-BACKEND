import { transporter } from "../../../config/emailNodeMailer.js";

const SRS_CC_EMAILS = [
    "optimisticashraf@gmail.com",
    "mohashin.bhyian@gmail.com",
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



export const sendComplianceEmail = async ({ to, name, status, docs }) => {
    // console.log("reached mailer")
    const subject =
        status === "FAILED"
            ? "Compliance Failed - Immediate Action Required"
            : "Compliance Warning - Action Required";

    const docList = docs
        .map(
            (d) =>
                `${d.type} (Expiry: ${d.expiry
                    ? new Date(d.expiry).toLocaleDateString("en-GB")
                    : "Missing"
                })`
        )
        .join(", ");

    // console.log("SUBJECT+DOC LIST", subject, docList)

    //     const html =
    //         ` <p>Dear ${name},</p>
    //     <p>Your compliance status is <strong>${status}</strong>.</p>
    //     <p><b>Affected documents:</b> ${docList}</p>
    //     <p>Please take necessary action.</p>

    //     <p>Thank you for working with SRS.</p>

    //     <p>This is a system generated email. Pls do not reply to this email. Contact your site manager for further information</p>
    //   `;

    const html = 
    `  <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6;">
    
    <p>Dear ${name},</p>

    <p>
      This is to inform you that your compliance status is 
      <strong style="color: ${status === "FAILED" ? "#d9534f" : "#f0ad4e"};">
        ${status}
      </strong>.
    </p>

    <p><strong>Affected documents:</strong></p>
    <ul>
      ${docs
            .map(
                (d) => `
        <li>
          ${d.type} - ${d.expiry
                        ? new Date(d.expiry).toLocaleDateString("en-GB")
                        : "Missing"
                    }
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

    <br/>

    <p>Thank you for working with SRS.</p>

    <p>Kind regards,<br/><strong>SRS Compliance Team</strong></p>

    <hr style="margin: 20px 0;" />

    <p style="font-size: 12px; color: #777;">
      <em>
        This is a system generated email. Please do not reply to this email.
        Contact your site manager for further information.
      </em>
    </p>

  </div>
`;

    const res = await transporter.sendMail({
        from: `"SRS COMPLIANCE" <noreply@srsdriverapp.com>`,
        to,
        cc: SRS_CC_EMAILS,
        subject,
        html
    });

    console.log("res", res)
};