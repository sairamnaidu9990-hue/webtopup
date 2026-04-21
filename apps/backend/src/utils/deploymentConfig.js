const { resolveSiteBaseUrl, toStringValue } = require("./orderFlow");

function isPublicHttpUrl(value) {
  const normalizedValue = toStringValue(value);

  if (!normalizedValue) {
    return false;
  }

  try {
    const parsed = new URL(normalizedValue);
    const hostname = parsed.hostname.toLowerCase();

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1"
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function resolveBackendPublicBaseUrl() {
  const candidates = [
    toStringValue(process.env.BACKEND_PUBLIC_URL),
    toStringValue(process.env.PUBLIC_API_URL),
    toStringValue(process.env.API_PUBLIC_URL),
    toStringValue(process.env.APP_URL),
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      return new URL(candidate).toString().replace(/\/+$/, "");
    } catch {
      continue;
    }
  }

  return "";
}

function buildWebhookUrls() {
  const backendBaseUrl = resolveBackendPublicBaseUrl();

  if (!backendBaseUrl) {
    return {
      tokopayCallbackUrl: "",
      bangjeffCallbackUrl: "",
    };
  }

  return {
    tokopayCallbackUrl: `${backendBaseUrl}/api/orders/tokopay/callback`,
    bangjeffCallbackUrl: `${backendBaseUrl}/api/orders/bangjeff/callback`,
  };
}

function getProductionReadinessWarnings(siteSetting, tokopayEnabled = false) {
  const warnings = [];
  const frontendBaseUrl = resolveSiteBaseUrl(siteSetting);
  const backendBaseUrl = resolveBackendPublicBaseUrl();

  if (!isPublicHttpUrl(frontendBaseUrl)) {
    warnings.push(
      "FRONTEND_URL atau siteDomain belum mengarah ke domain publik yang valid."
    );
  }

  if (!isPublicHttpUrl(backendBaseUrl)) {
    warnings.push(
      "BACKEND_PUBLIC_URL belum mengarah ke domain publik yang valid untuk webhook provider/payment."
    );
  }

  if (tokopayEnabled && !isPublicHttpUrl(frontendBaseUrl)) {
    warnings.push(
      "Tokopay aktif tetapi redirect invoice masih memakai URL lokal/private."
    );
  }

  return warnings;
}

module.exports = {
  buildWebhookUrls,
  getProductionReadinessWarnings,
  isPublicHttpUrl,
  resolveBackendPublicBaseUrl,
};
