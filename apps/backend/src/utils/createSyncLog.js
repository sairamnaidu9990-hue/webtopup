const SyncLog = require("../models/SyncLog");

async function createSyncLog({
  provider,
  action,
  scope = "provider",
  status,
  syncSource = "",
  region = "",
  productCode = "",
  summary = null,
  errorMessage = "",
  admin = null,
}) {
  try {
    await SyncLog.create({
      provider,
      action,
      scope,
      status,
      syncSource,
      region,
      productCode,
      summary,
      errorMessage,
      triggeredBy: admin
        ? {
            adminId: admin._id || null,
            name: admin.name || "",
            email: admin.email || "",
            role: admin.role || "",
          }
        : undefined,
    });
  } catch (error) {
    console.error("Failed to write sync log:", error.message);
  }
}

module.exports = createSyncLog;
