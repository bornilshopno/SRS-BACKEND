// src/server.js
import "@dotenvx/dotenvx/config";
import admin from "firebase-admin";
import app from "./index.js";
import connectDB from "./config/db.js";
import { initFirebase } from "./config/firebaseAdmin.js";
import { initializeUserIndexes } from "./app/services/userService.js";

const PORT = process.env.PORT || 5000;

// ENV var থেকে safe parse করো
let serviceAccount;
try {
  const rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!rawEnv) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT not set in ENV");
  }
  // Render-এ ENV raw JSON আসে, তাই direct parse
  serviceAccount = JSON.parse(rawEnv);
} catch (err) {
  console.error("Firebase ENV parse failed:", err.message);
  process.exit(1);
}

// ✅ Initialize Firebase once
initFirebase(serviceAccount);

try {
  await connectDB();
  await initializeUserIndexes();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (error) {
  console.error("MongoDB failed:", error.message);
  process.exit(1);
}