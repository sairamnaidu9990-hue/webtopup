require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./src/config/db");
const {
  initRealtimeServer,
  shutdownRealtimeServer,
} = require("./src/realtime/realtimeServer");
const {
  startBangjeffAutoSyncScheduler,
  stopBangjeffAutoSyncScheduler,
} = require("./src/schedulers/bangjeffAutoSyncScheduler");
const { logError, logFatal, logInfo } = require("./src/utils/appLogger");
const { buildWebhookUrls, getProductionReadinessWarnings } = require("./src/utils/deploymentConfig");
const SiteSetting = require("./src/models/SiteSetting");

const PORT = process.env.PORT || 4000;
const HOST =
  process.env.HOST ||
  (process.env.NODE_ENV === "production" ? "127.0.0.1" : "0.0.0.0");
let server = null;

async function logDeploymentReadiness() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const siteSetting = await SiteSetting.findOne({}, { siteDomain: 1 }).lean();
  const warnings = getProductionReadinessWarnings(
    siteSetting,
    Boolean(process.env.TOKOPAY_MERCHANT_ID && process.env.TOKOPAY_SECRET)
  );

  if (warnings.length === 0) {
    logInfo({
      source: "backend",
      scope: "deployment",
      message: "Webhook/domain production readiness looks good",
      meta: buildWebhookUrls(),
      persist: false,
    });
    return;
  }

  logError({
    source: "backend",
    scope: "deployment",
    message: "Masih ada konfigurasi production yang perlu dirapikan",
    meta: {
      warnings,
      ...buildWebhookUrls(),
    },
    persist: true,
  });
}

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
    stopBangjeffAutoSyncScheduler();
    shutdownRealtimeServer();
    server.close(() => process.exit(1));
    return;
  }

  process.exit(1);
});

async function startServer() {
  try {
    await connectDB();

    server = http.createServer(app);
    initRealtimeServer(server);
    startBangjeffAutoSyncScheduler();

    server.listen(PORT, HOST, () => {
      logInfo({
        source: "backend",
        scope: "server",
        message: `Server running on http://${HOST}:${PORT}`,
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

  if (process.env.NODE_ENV === "production") {
    void logDeploymentReadiness().catch((error) => {
      logError({
        source: "backend",
        scope: "deployment",
        message: "Gagal mengecek readiness production",
        error,
        persist: true,
      });
    });
  }
}

startServer();
