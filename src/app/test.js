import { sendEmailByBrevo } from "./services/emailServices/brevoEmailService.js";



await sendEmailByBrevo({
  to: "yourpersonalemail@gmail.com",
  subject: "Test Email",
  html: "<h1>Brevo Working 🚀</h1>",
});


