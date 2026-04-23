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
    return await SyncLog.create({
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
    return null;
  }
}

async function updateSyncLog(syncLogId, updates = {}) {
  if (!syncLogId) {
    return null;
  }

  try {
    return await SyncLog.findByIdAndUpdate(
      syncLogId,
      {
        $set: {
          ...updates,
        },
      },
      { new: true }
    );
  } catch (error) {
    console.error("Failed to update sync log:", error.message);
    return null;
  }
}

createSyncLog.updateSyncLog = updateSyncLog;

module.exports = createSyncLog;
