require("dotenv").config();

const app = require("./app");
const connectDB = require("./src/config/db");
const { logError, logFatal, logInfo } = require("./src/utils/appLogger");

const PORT = process.env.PORT || 4000;
let server = null;

process.on("unhandledRejection", (error) => {
  logFatal({
    source: "backend",
    scope: "process",
    message: "Unhandled promise rejection",
    error,
    persist: true,
  });
});

process.on("uncaughtException", (error) => {
  logFatal({
    source: "backend",
    scope: "process",
    message: "Uncaught exception",
    error,
    persist: true,
  });

  if (server) {
    server.close(() => process.exit(1));
    return;
  }

  process.exit(1);
});

async function startServer() {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      logInfo({
        source: "backend",
        scope: "server",
        message: `Server running on http://localhost:${PORT}`,
        persist: false,
      });
    });
  } catch (error) {
    logError({
      source: "backend",
      scope: "server",
      message: "Failed to start backend server",
      error,
      persist: true,
    });
    process.exit(1);
  }
}

startServer();
