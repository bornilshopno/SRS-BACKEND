import "@dotenvx/dotenvx/config"; // for esm
import app from "./index.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

try {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
} catch (error) {
  console.error("❌ Failed to connect to MongoDB:", error.message);
  process.exit(1);
}
