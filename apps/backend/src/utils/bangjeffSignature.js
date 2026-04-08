const crypto = require("crypto");

function normalizePathname(pathname) {
  let normalizedPathname = pathname || "";

  try {
    normalizedPathname = new URL(pathname).pathname;
  } catch {}

  return String(normalizedPathname).replace(/^\/+/, "");
}

const generateSignature = (method, pathname, payload, timestamp, clientId) => {
  const payloadString = JSON.stringify(payload ?? {});
  const hashedPayload = crypto
    .createHash("md5")
    .update(payloadString)
    .digest("hex");
  const timestampString = String(timestamp);
  const signaturePayload = `${String(method).toUpperCase()}:${normalizePathname(
    pathname
  )}:${hashedPayload}:${timestampString}`;

  const signature = crypto
    .createHmac("sha256", clientId)
    .update(signaturePayload)
    .digest("hex");

  return signature;
};

module.exports = generateSignature;
