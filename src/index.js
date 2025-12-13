import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./app/routes/userRoutes.js";
import termsRoutes from "./app/routes/termsRoutes.js";
import activityRoutes from "./app/routes/activityRoutes.js";
import routingRoutes from "./app/routes/routingRoutes.js";

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

// Root route
app.get("/", (req, res) => {
  res.send("✅ Server is running on Render!");
});

export default app;
