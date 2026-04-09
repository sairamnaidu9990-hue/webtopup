const SyncLog = require("../models/SyncLog");

exports.getSyncLogs = async (req, res) => {
  try {
    const filter = {};

    if (req.query.provider) {
      filter.provider = String(req.query.provider).trim().toLowerCase();
    }

    if (req.query.status) {
      filter.status = String(req.query.status).trim().toUpperCase();
    }

    if (req.query.action) {
      filter.action = String(req.query.action).trim();
    }

    if (req.query.syncSource) {
      filter.syncSource = String(req.query.syncSource).trim().toLowerCase();
    }

    const logs = await SyncLog.find(filter).sort({ createdAt: -1 }).limit(100);

    return res.status(200).json({
      logs,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil sync logs",
      error: error.message,
    });
  }
};
