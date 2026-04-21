const { logWarn } = require("../utils/appLogger");

function toStringValue(value) {
  return String(value || "").trim();
}

function parseAllowedIps(value, defaultIps = []) {
  const configuredIps = toStringValue(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return [...new Set([...configuredIps, ...defaultIps])];
}

function extractClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return String(forwardedFor[0] || "").trim();
  }

  const rawIp =
    req.ip ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "";

  return toStringValue(rawIp).replace(/^::ffff:/i, "");
}

function isLocalIp(ipAddress) {
  const normalized = toStringValue(ipAddress).toLowerCase();

  return (
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "localhost"
  );
}

function createCallbackIpAllowlist(options) {
  const providerName = toStringValue(options?.providerName || "Callback");
  const envVarName = toStringValue(options?.envVarName);
  const defaultIps = Array.isArray(options?.defaultIps) ? options.defaultIps : [];

  return function callbackIpAllowlist(req, res, next) {
    const ipAddress = extractClientIp(req);
    const allowLocal =
      String(process.env.ALLOW_LOCAL_WEBHOOKS || "").toLowerCase() === "true" ||
      process.env.NODE_ENV !== "production";
    const allowedIps = parseAllowedIps(
      envVarName ? process.env[envVarName] : "",
      defaultIps
    );

    if (!allowedIps.length) {
      return next();
    }

    if (
      allowedIps.includes(ipAddress) ||
      (allowLocal && isLocalIp(ipAddress))
    ) {
      return next();
    }

    res.locals.skipRequestLog = true;
    logWarn({
      source: "backend",
      scope: "webhook-security",
      message: `${providerName} callback diblokir karena IP tidak diizinkan`,
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 403,
      meta: {
        providerName,
        ipAddress,
        allowedIps,
      },
    });

    return res.status(403).json({
      status: false,
      message: "IP callback tidak diizinkan",
    });
  };
}

module.exports = {
  createCallbackIpAllowlist,
  extractClientIp,
  parseAllowedIps,
};
