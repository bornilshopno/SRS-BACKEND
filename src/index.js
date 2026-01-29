import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./app/routes/userRoutes.js";
import termsRoutes from "./app/routes/termsRoutes.js";
import activityRoutes from "./app/routes/activityRoutes.js";
import routingRoutes from "./app/routes/routingRoutes.js";
import payrunRoutes from "./app/routes/payrunRoutes.js";
import loanRoutes from "./app/routes/loanRoutes.js";
import adjustmentRoutes from "./app/routes/adjustmentRoutes.js";
import invoiceRoutes from "./app/routes/invoiceRoutes.js";
import defaultRoutes from "./app/routes/defaultRoutes.js";

const app = express();

// Middleware

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));


// http://localhost:5173
// https://srsmanagement.netlify.app

// app.use(
//   cors({
//     origin:
//       process.env.NODE_ENV === "production"
//         ? process.env.CLIENT_URL   // Production URL from env
//         : "http://localhost:5173", // Dev URL
//     credentials: true,
//   })
// );


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/terms", termsRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/routings", routingRoutes);
app.use("/api/payruns", payrunRoutes);
app.use("/api/adjustments", adjustmentRoutes);
app.use("/api/loans", loanRoutes);
app.use('/api/invoices', invoiceRoutes)
app.use('/api/defaults', defaultRoutes)

// Root route
app.get("/", (req, res) => {
  res.send("✅ Server is running on Render!");
});

export default app;
