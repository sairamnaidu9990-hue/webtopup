const axios = require("axios");
const crypto = require("crypto");

function toStringValue(value) {
  return String(value || "").trim();
}

function getTokopayConfig() {
  const merchantId = toStringValue(process.env.TOKOPAY_MERCHANT_ID);
  const secret = toStringValue(process.env.TOKOPAY_SECRET);
  const apiBase = toStringValue(process.env.TOKOPAY_API_BASE) || "https://api.tokopay.id";

  return {
    merchantId,
    secret,
    apiBase: apiBase.replace(/\/+$/, ""),
    enabled: Boolean(merchantId && secret),
  };
}

function md5(value) {
  return crypto.createHash("md5").update(String(value)).digest("hex");
}

function createTokopaySignature(merchantId, secret, refId) {
  return md5(`${merchantId}:${secret}:${refId}`);
}

function ensureTokopayEnabled(config) {
  if (config.enabled) {
    return;
  }

  throw new Error("Tokopay belum dikonfigurasi di backend");
}

function unwrapTokopayResponse(endpoint, response) {
  if (!response || typeof response !== "object") {
    throw new Error(`Empty Tokopay response for ${endpoint}`);
  }

  if (String(response.status || "").trim().toLowerCase() !== "success") {
    const error = new Error(
      toStringValue(response.error_msg) ||
        toStringValue(response.message) ||
        `Tokopay request failed for ${endpoint}`
    );

    error.tokopay = response;
    throw error;
  }

  return response;
}

async function createTokopayTransaction({
  channelCode,
  refId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  redirectUrl,
  expiredTs,
  items = [],
}) {
  const config = getTokopayConfig();
  ensureTokopayEnabled(config);

  const payload = {
    merchant_id: config.merchantId,
    kode_channel: channelCode,
    reff_id: refId,
    amount: Number(amount || 0),
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    redirect_url: redirectUrl,
    expired_ts: Number(expiredTs || 0),
    signature: createTokopaySignature(config.merchantId, config.secret, refId),
    items,
  };

  const { data } = await axios.post(`${config.apiBase}/v1/order`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });

  return unwrapTokopayResponse("/v1/order", data);
}

async function checkTokopayTransaction({
  refId,
  amount,
  methodCode,
}) {
  const config = getTokopayConfig();
  ensureTokopayEnabled(config);

  const searchParams = new URLSearchParams({
    merchant: config.merchantId,
    secret: config.secret,
    ref_id: refId,
    nominal: String(Number(amount || 0)),
    metode: methodCode,
  });

  const { data } = await axios.get(`${config.apiBase}/v1/order?${searchParams.toString()}`, {
    timeout: 30000,
  });

  return unwrapTokopayResponse("/v1/order (check)", data);
}

function verifyTokopayCallbackSignature(signature, refId) {
  const config = getTokopayConfig();
  ensureTokopayEnabled(config);

  const expectedSignature = createTokopaySignature(
    config.merchantId,
    config.secret,
    refId
  );

  return toStringValue(signature).toLowerCase() === expectedSignature.toLowerCase();
}

module.exports = {
  checkTokopayTransaction,
  createTokopayTransaction,
  createTokopaySignature,
  getTokopayConfig,
  verifyTokopayCallbackSignature,
};
