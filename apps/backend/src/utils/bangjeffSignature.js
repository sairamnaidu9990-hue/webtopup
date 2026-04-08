const crypto = require("crypto");

function normalizePathname(pathname, keepLeadingSlash = false) {
  let normalizedPathname = pathname || "";

  try {
    normalizedPathname = new URL(pathname).pathname;
  } catch {}

  const cleanPathname = String(normalizedPathname).trim().replace(/^\/+/, "");

  if (keepLeadingSlash) {
    return `/${cleanPathname}`;
  }

  return cleanPathname;
}

const generateSignature = (
  method,
  pathname,
  payload,
  timestamp,
  clientId,
  options = {}
) => {
  const payloadString = JSON.stringify(payload ?? {});
  const hashedPayload = crypto
    .createHash("md5")
    .update(payloadString)
    .digest("hex");
  const timestampString = String(timestamp);
  const signaturePayload = `${String(method).toUpperCase()}:${normalizePathname(
    pathname,
    options.keepLeadingSlash
  )}:${hashedPayload}:${timestampString}`;

  const signature = crypto
    .createHmac("sha256", clientId)
    .update(signaturePayload)
    .digest("hex");

  return signature;
};

module.exports = generateSignature;
