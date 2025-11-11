import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./app/routes/userRoutes.js";
import termsRoutes from "./app/routes/termsRoutes.js";

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/terms", termsRoutes);

app.get("/", (req, res) => {
  res.send("Server is running...");
});

export default app;
