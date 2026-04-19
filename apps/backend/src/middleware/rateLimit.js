const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 100;

function getPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function getClientIdentifier(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return String(forwardedFor[0]).trim();
  }

  return (
    req.ip ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "unknown"
  );
}

function createRateLimit(options = {}) {
  const windowMs = getPositiveInteger(options.windowMs, DEFAULT_WINDOW_MS);
  const maxRequests = getPositiveInteger(options.maxRequests, DEFAULT_MAX_REQUESTS);
  const message =
    options.message || "Terlalu banyak permintaan. Coba lagi beberapa saat lagi.";
  const keyGenerator =
    typeof options.keyGenerator === "function"
      ? options.keyGenerator
      : getClientIdentifier;

  const entries = new Map();

  const cleanupInterval = setInterval(() => {
    const now = Date.now();

    for (const [key, entry] of entries.entries()) {
      if (entry.resetAt <= now) {
        entries.delete(key);
      }
    }
  }, Math.max(windowMs, 60 * 1000));

  if (typeof cleanupInterval.unref === "function") {
    cleanupInterval.unref();
  }

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const rawKey = keyGenerator(req);
    const key = String(rawKey || "unknown");
    const currentEntry = entries.get(key);

    const entry =
      currentEntry && currentEntry.resetAt > now
        ? currentEntry
        : {
            count: 0,
            resetAt: now + windowMs,
          };

    entry.count += 1;
    entries.set(key, entry);

    const remaining = Math.max(maxRequests - entry.count, 0);
    const retryAfterSeconds = Math.max(
      Math.ceil((entry.resetAt - now) / 1000),
      1
    );

    res.setHeader("X-RateLimit-Limit", String(maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", new Date(entry.resetAt).toISOString());

    if (entry.count > maxRequests) {
      res.setHeader("Retry-After", String(retryAfterSeconds));

      return res.status(429).json({
        message,
        retryAfterSeconds,
      });
    }

    return next();
  };
}

module.exports = {
  createRateLimit,
};
