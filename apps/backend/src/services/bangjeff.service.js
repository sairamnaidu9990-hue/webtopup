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

  return unwrapBangjeffResponse("/api/v4/variant", response);
}

module.exports = {
  getBangjeffProducts,
  getBangjeffProductDetail,
  getBangjeffVariants,
};
