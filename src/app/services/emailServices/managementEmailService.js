// /services/emailService.mjs

import { transporter } from "../../../config/emailNodeMailer.js";


const SRS_EMAILS = [
  "optimisticashraf@gmail.com",
  // "mohashin.bhyian@gmail.com",
];




export const sendManagementReportEmail = async ({ FAILED, WARNING }) => {

  const html = `
  <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6;">
    
    <p>Dear Sir,</p>

    <p>
      Please find below the latest compliance status of drivers.
    </p>


    <!-- 🔴 FAILED SECTION -->
    <h3 style="color: #d9534f; margin-top: 20px;">
    Drivers With Documents Expired  (${FAILED.length})
    </h3>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f8d7da;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Name</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">SRS Driver No</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Document[Expiry]</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Latest Mailed</th>
        </tr>
      </thead>
      <tbody>
        ${FAILED.length > 0
      ? FAILED.map(
        ({ driver, docs }) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${driver.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${driver.srsDriverNumber}</td>
<td style="border: 1px solid #ddd; padding: 8px;">
  ${docs
            .map(
              (d) => `
        <span style="
          display: inline-block;
          border-radius: 4px;
          padding: 4px 8px;
          margin: 2px;
          font-size: 12px;
          background-color: ${d.daysRemaining < 0 ? "#f8d7da" : "#fff3cd"
                };
          border: 1px solid ${d.daysRemaining < 0 ? "#f5c2c7" : "#ffe69c"
                };
        ">
          ${d.type} [${d.expiry
                  ? new Date(d.expiry).toLocaleDateString("en-GB")
                  : "Missing"
                }]
        </span>
      `
            )
            .join("")}
</td>
<td style="border: 1px solid #ddd; padding: 8px;">
${driver.emailStatus
            ? new Date(driver.emailStatus).toLocaleDateString("en-GB")
            : "-"
          }
</td>
              </tr>
            `
      ).join("")
      : `
              <tr>
                <td colspan="4" style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #777;">
                  No drivers with documents already expired.
                </td>
              </tr>
            `
    }
      </tbody>
    </table>

    <!-- 🟡 WARNING SECTION -->
    <h3 style="color: #f0ad4e;">
      Drivers With Document at Warning Stage (${WARNING.length})
    </h3>

    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #fff3cd;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Name</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">SRS Driver No</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Document[Expiry]</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Latest Mailed</th>
        </tr>
      </thead>
      <tbody>
        ${WARNING.length > 0
      ? WARNING.map(
        ({ driver, docs }) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${driver.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${driver.srsDriverNumber}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">
  ${docs
            .map(
              (d) => `
        <span style="
          display: inline-block;
          border-radius: 4px;
          padding: 4px 8px;
          margin: 2px;
          font-size: 12px;
          background-color: ${d.daysRemaining < 0 ? "#f8d7da" : "#fff3cd"
                };
          border: 1px solid ${d.daysRemaining < 0 ? "#f5c2c7" : "#ffe69c"
                };
        ">
          ${d.type} [${d.expiry
                  ? new Date(d.expiry).toLocaleDateString("en-GB")
                  : "Missing"
                }]
        </span>
      `
            )
            .join("")}
</td>
<td style="border: 1px solid #ddd; padding: 8px;">
${driver.emailStatus
            ? new Date(driver.emailStatus).toLocaleDateString("en-GB")
            : "-"
          }
</td>
              </tr>
            `
      ).join("")
      : `
              <tr>
                <td colspan="4" style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #777;">
                  No drivers with documents at the eve of being expired.
                </td>
              </tr>
            `
    }
      </tbody>
    </table>

    <br/>

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
    from: `"SRS Compliance" <noreply@srsdriverapp.com>`,
    to: SRS_EMAILS,
    subject: "Weekly Driver Compliance Report",
    html
  });

  console.log("from managerment mailing", res)
};