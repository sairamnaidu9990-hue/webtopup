const { logInfo, logWarn, redactValue } = require("../utils/appLogger");

function getSlowRequestThresholdMs() {
  const parsed = Number.parseInt(
    String(process.env.REQUEST_WARN_THRESHOLD_MS || "1500"),
    10
  );

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1500;
  }

  return parsed;
}

function shouldLogAllRequests() {
  return String(process.env.LOG_ALL_REQUESTS || "").toLowerCase() === "true";
}

function requestLogger(req, res, next) {
  const startedAt = req.requestStartedAt || Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const statusCode = res.statusCode || 200;

    if (res.locals.skipRequestLog) {
      return;
    }

    const actor = req.admin
      ? {
          adminId: req.admin._id,
          email: req.admin.email,
          role: req.admin.role,
        }
      : undefined;
    const logPayload = {
      source: "backend",
      scope: "http",
      message: `${req.method} ${req.originalUrl} -> ${statusCode}`,
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode,
      durationMs,
      actor,
      meta: {
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "",
        query: redactValue(req.query),
      },
    };

    if (statusCode >= 500) {
      logWarn({
        ...logPayload,
        message: `HTTP server error ${req.method} ${req.originalUrl}`,
      });
      return;
    }

    if (statusCode >= 400) {
      logWarn({
        ...logPayload,
        message: `HTTP client error ${req.method} ${req.originalUrl}`,
      });
      return;
    }

    if (durationMs >= getSlowRequestThresholdMs()) {
      logWarn({
        ...logPayload,
        message: `HTTP slow request ${req.method} ${req.originalUrl}`,
      });
      return;
    }

    if (shouldLogAllRequests()) {
      logInfo(logPayload);
    }
  });

  next();
}

module.exports = {
  requestLogger,
};
