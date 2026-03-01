// routes/testEmailRoute.js

import express from "express";
import { sendEmailByBrevo } from "../../config/emailNodeMailer.js";
0

const router = express.Router();

router.post("/test-email", async (req, res) => {
  try {
    await sendEmailByBrevo({
      to: "srsdriverapp@gmail.com",
      subject: "Brevo Test Email",
      html: "<h1>Brevo Working 🚀</h1>",
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Email failed", error });
  }
});

export default router;