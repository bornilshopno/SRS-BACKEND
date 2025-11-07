import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./app/routes/userRoutes.js";

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

app.get("/", (req, res) => {
  res.send("Server is running...");
});

export default app;
