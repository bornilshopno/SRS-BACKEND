// src/server.js
import "@dotenvx/dotenvx/config";
import admin from "firebase-admin";
import app from "./index.js";
import connectDB from "./config/db.js";

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
  console.error("Check Render Environment tab");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

global.firebaseAuth = admin.auth();

try {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (error) {
  console.error("MongoDB failed:", error.message);
  process.exit(1);
}