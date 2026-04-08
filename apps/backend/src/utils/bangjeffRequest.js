const axios = require("axios");
const generateSignature = require("./bangjeffSignature");
const formatBangjeffTimestamp = require("./formatBangjeffTimestamp");

const BASE_URL =
  process.env.BANGJEFF_BASE_URL ||
  "https://distribution-api.bangjeff.com";

function isSignatureMismatch(payload) {
  return String(payload?.message || "")
    .toLowerCase()
    .includes("signature");
}

function createBangjeffError(message, status, response, meta = {}) {
  const bangjeffError = new Error(message || "BangJeff request failed");
  bangjeffError.status = status || null;
  bangjeffError.bangjeff = response || null;
  bangjeffError.meta = meta;

  return bangjeffError;
}

function buildAttempts(now) {
  const configuredTimeZone =
    process.env.BANGJEFF_TIMEZONE || "Asia/Jakarta";
  const localTimeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || configuredTimeZone;
  const attempts = [];
  const seen = new Set();

  function pushAttempt(timeZone, keepLeadingSlash) {
    const timestamp = formatBangjeffTimestamp(now, timeZone);
    const key = `${timestamp}|${keepLeadingSlash ? "slash" : "plain"}`;

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    attempts.push({
      timestamp,
      keepLeadingSlash,
      timeZone,
    });
  }

  pushAttempt(configuredTimeZone, false);
  pushAttempt(configuredTimeZone, true);

  if (localTimeZone && localTimeZone !== configuredTimeZone) {
    pushAttempt(localTimeZone, false);
    pushAttempt(localTimeZone, true);
  }

  return attempts;
}

const bangjeffRequest = async (method, endpoint, body) => {
  const clientId = String(process.env.BANGJEFF_API_KEY || "").trim();

  if (!clientId) {
    throw new Error("BANGJEFF_API_KEY is required");
  }

  const payload = body ?? {};
  const attempts = buildAttempts(new Date());
  let lastError = null;

  for (const attempt of attempts) {
    const signature = generateSignature(
      method,
      endpoint,
      payload,
      attempt.timestamp,
      clientId,
      { keepLeadingSlash: attempt.keepLeadingSlash }
    );

    try {
      const res = await axios({
        method: String(method).toUpperCase(),
        url: `${BASE_URL}${endpoint}`,
        data: payload,
        headers: {
          "X-Client-Id": clientId,
          "X-Request-Time": attempt.timestamp,
          "X-Signature": signature,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      });

      if (res.data?.rc === "01" && isSignatureMismatch(res.data)) {
        lastError = createBangjeffError(
          res.data.message,
          res.status,
          res.data,
          attempt
        );
        continue;
      }

      return res.data;
    } catch (error) {
      const responsePayload = error.response?.data || null;

      if (isSignatureMismatch(responsePayload)) {
        lastError = createBangjeffError(
          responsePayload?.message || error.message,
          error.response?.status,
          responsePayload,
          attempt
        );
        continue;
      }

      throw createBangjeffError(
        responsePayload?.message || error.message || "BangJeff request failed",
        error.response?.status,
        responsePayload,
        attempt
      );
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw createBangjeffError("BangJeff request failed", null, null);
};

module.exports = bangjeffRequest;
