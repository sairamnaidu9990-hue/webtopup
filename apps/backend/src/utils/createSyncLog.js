const SyncLog = require("../models/SyncLog");
const { broadcastSyncLogUpdate } = require("../realtime/realtimeServer");

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
    const syncLog = await SyncLog.create({
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
    broadcastSyncLogUpdate(syncLog, "sync-log-create");
    return syncLog;
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
    const syncLog = await SyncLog.findByIdAndUpdate(
      syncLogId,
      {
        $set: {
          ...updates,
        },
      },
      { new: true }
    );
    broadcastSyncLogUpdate(syncLog, "sync-log-update");
    return syncLog;
  } catch (error) {
    console.error("Failed to update sync log:", error.message);
    return null;
  }
}

createSyncLog.updateSyncLog = updateSyncLog;

module.exports = createSyncLog;
