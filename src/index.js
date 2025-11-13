import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./app/routes/userRoutes.js";
import termsRoutes from "./app/routes/termsRoutes.js";

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
app.use("/api/users", userRoutes);
app.use("/api/terms", termsRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("✅ Server is running on Render!");
});

// // ✅ for a catch-all route
// app.all("*", (req, res) => {
//   res.status(404).json({ message: "API route not found" });
// });

export default app;
