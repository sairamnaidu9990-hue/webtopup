const mongoose = require("mongoose");
const { logError, logInfo } = require("../utils/appLogger");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logInfo({
      source: "backend",
      scope: "database",
      message: "MongoDB connected",
      persist: false,
    });
  } catch (error) {
    logError({
      source: "backend",
      scope: "database",
      message: "MongoDB connection error",
      error,
      persist: true,
    });
    process.exit(1);
  }
}

module.exports = connectDB;
