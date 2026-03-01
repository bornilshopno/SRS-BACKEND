import { sendEmailByBrevo } from "../config/emailNodeMailer.js";


await sendEmailByBrevo({
  to: "yourpersonalemail@gmail.com",
  subject: "Test Email",
  html: "<h1>Brevo Working 🚀</h1>",
});


