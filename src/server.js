// import dotenv from "dotenv";
// dotenv.config();
import '@dotenvx/dotenvx/config' // for esm

import app from "./index.js";
import connectDB from "./config/db.js";



// Connect to MongoDB
await connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
