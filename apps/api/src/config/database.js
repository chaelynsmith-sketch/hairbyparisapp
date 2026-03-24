const mongoose = require("mongoose");

async function connectDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(process.env.MONGODB_URI);
}

module.exports = { connectDatabase };
