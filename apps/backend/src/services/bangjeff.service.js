const bangjeffRequest = require("../utils/bangjeffRequest");

function unwrapBangjeffResponse(endpoint, response) {
  if (!response) {
    throw new Error(`Empty BangJeff response for ${endpoint}`);
  }

  if (response.rc !== "00") {
    const error = new Error(
      response.message || `BangJeff request failed for ${endpoint}`
    );

    error.bangjeff = response;
    throw error;
  }

  return response.data;
}

function normalizeBangjeffVariantsPayload(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data) {
    return [];
  }

  if (Array.isArray(data.variants)) {
    return data.variants;
  }

  if (Array.isArray(data.items)) {
    return data.items;
  }

  if (Array.isArray(data.list)) {
    return data.list;
  }

  return null;
}

async function getBangjeffProducts(region) {
  const response = await bangjeffRequest("POST", "/api/v4/product", {
    region,
  });

  return unwrapBangjeffResponse("/api/v4/product", response);
}

async function getBangjeffProductDetail(region, productCode) {
  const response = await bangjeffRequest("POST", "/api/v4/product/detail", {
    region,
    productCode,
  });

  return unwrapBangjeffResponse("/api/v4/product/detail", response);
}

async function getBangjeffVariants(region, productCode) {
  const response = await bangjeffRequest("POST", "/api/v4/variant", {
    region,
    productCode,
  });

  const data = unwrapBangjeffResponse("/api/v4/variant", response);
  const normalized = normalizeBangjeffVariantsPayload(data);

  if (normalized !== null) {
    return normalized;
  }

  const dataType = Array.isArray(data) ? "array" : typeof data;
  const keys =
    data && typeof data === "object" && !Array.isArray(data)
      ? Object.keys(data).join(", ")
      : "";
  const error = new Error(
    `BangJeff variant response is invalid (type: ${dataType}${
      keys ? `, keys: ${keys}` : ""
    })`
  );
  error.bangjeff = response;
  throw error;
}

async function getBangjeffBalance(region) {
  const response = await bangjeffRequest("POST", "/api/v4/balance", {
    region,
  });

  return unwrapBangjeffResponse("/api/v4/balance", response);
}

module.exports = {
  getBangjeffProducts,
  getBangjeffProductDetail,
  getBangjeffVariants,
  getBangjeffBalance,
};
