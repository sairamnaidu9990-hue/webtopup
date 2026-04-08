const axios = require("axios");
const generateSignature = require("./bangjeffSignature");
const formatBangjeffTimestamp = require("./formatBangjeffTimestamp");

const BASE_URL =
  process.env.BANGJEFF_BASE_URL ||
  "https://distribution-api.bangjeff.com";

const bangjeffRequest = async (method, endpoint, body) => {
  const clientId = process.env.BANGJEFF_API_KEY;

  if (!clientId) {
    throw new Error("BANGJEFF_API_KEY is required");
  }

  const timestamp = formatBangjeffTimestamp(new Date());

  const signature = generateSignature(
    method,
    endpoint,
    body,
    timestamp,
    clientId
  );

  try {
    const res = await axios({
      method: String(method).toUpperCase(),
      url: `${BASE_URL}${endpoint}`,
      data: body ?? {},
      headers: {
        "X-Client-Id": clientId,
        "X-Request-Time": timestamp,
        "X-Signature": signature,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    return res.data;
  } catch (error) {
    const bangjeffError = new Error(
      error.response?.data?.message || error.message || "BangJeff request failed"
    );

    bangjeffError.status = error.response?.status;
    bangjeffError.bangjeff = error.response?.data || null;
    throw bangjeffError;
  }
};

module.exports = bangjeffRequest;
