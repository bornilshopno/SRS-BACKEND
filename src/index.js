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
import mailRoutes from "./app/routes/mailRoutes.js";
import path from "path";


const app = express();

// Middleware

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));





app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/users", userRoutes);
app.use("/terms", termsRoutes);
app.use("/activity", activityRoutes);
app.use("/routings", routingRoutes);
app.use("/payruns", payrunRoutes);
app.use("/adjustments", adjustmentRoutes);
app.use("/loans", loanRoutes);
app.use('/invoices', invoiceRoutes)
app.use('/defaults', defaultRoutes)
app.use('/mailing', mailRoutes)

//Serve fileUploads as Static Folder
app.use("/uploads", express.static(path.join(process.cwd(), "fileUploads")));

// Root route
app.get("/", (req, res) => {
  res.send("✅ Server is running on Render!");
});

export default app;
