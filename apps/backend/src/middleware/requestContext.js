const crypto = require("crypto");

function createRequestId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function requestContext(req, res, next) {
  const existingRequestId =
    req.headers["x-request-id"] || req.headers["x-correlation-id"];
  const requestId = String(existingRequestId || createRequestId());

  req.requestId = requestId;
  req.requestStartedAt = Date.now();
  res.locals.requestId = requestId;

  res.setHeader("X-Request-Id", requestId);

  next();
}

module.exports = {
  requestContext,
};
