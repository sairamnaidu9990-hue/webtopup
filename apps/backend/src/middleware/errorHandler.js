const { logError, logWarn } = require("../utils/appLogger");

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode =
    error?.statusCode ||
    error?.status ||
    (typeof error?.message === "string" &&
    error.message.toLowerCase().includes("cors")
      ? 403
      : 500);
  const actor = req.admin
    ? {
        adminId: req.admin._id,
        email: req.admin.email,
        role: req.admin.role,
      }
    : undefined;
  res.locals.skipRequestLog = true;

  const logPayload = {
    source: "backend",
    scope: "http",
    message: `Unhandled request error on ${req.method} ${req.originalUrl}`,
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl || req.url || "",
    statusCode,
    actor,
    meta: {
      ip: req.ip,
      query: req.query,
      body: req.body,
    },
    error,
  };

  if (statusCode >= 500) {
    logError(logPayload);
  } else {
    logWarn(logPayload);
  }

  return res.status(statusCode).json({
    message:
      statusCode >= 500
        ? "Terjadi kesalahan server"
        : error?.message || "Permintaan tidak dapat diproses",
    requestId: req.requestId || "",
  });
}

module.exports = {
  errorHandler,
};
