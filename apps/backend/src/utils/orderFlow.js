function toStringValue(value) {
  return String(value || "").trim();
}

function normalizeCode(value) {
  return toStringValue(value).toUpperCase();
}

function resolveSiteBaseUrl(siteSetting) {
  const candidates = [
    toStringValue(siteSetting?.siteDomain),
    toStringValue(process.env.FRONTEND_URL),
    toStringValue(process.env.NEXT_PUBLIC_FRONTEND_URL),
    toStringValue(process.env.PUBLIC_APP_URL),
    toStringValue(process.env.APP_URL),
    "http://localhost:3001",
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

  return "http://localhost:3001";
}

function buildInvoiceUrl(siteSetting, invoiceNumber) {
  const baseUrl = resolveSiteBaseUrl(siteSetting);
  return `${baseUrl}/invoice/${encodeURIComponent(invoiceNumber)}`;
}

function getTokopayExpireMinutes() {
  const value = Number(process.env.TOKOPAY_EXPIRED_MINUTES || 1440);

  if (!Number.isFinite(value) || value <= 0) {
    return 1440;
  }

  return Math.floor(value);
}

function getTokopayExpiryDate() {
  return new Date(Date.now() + getTokopayExpireMinutes() * 60 * 1000);
}

function getFirstNonEmptyStatus(candidates) {
  for (const candidate of candidates) {
    const value = toStringValue(candidate);

    if (value) {
      return value;
    }
  }

  return "";
}

function getTokopayRawStatus(payload, source) {
  const transactionStatus = getFirstNonEmptyStatus([
    payload?.data?.status,
    payload?.data?.payment_status,
    payload?.data?.transaction_status,
    payload?.data?.trx_status,
    payload?.data?.status_transaksi,
    payload?.data?.status_bayar,
  ]);

  if (source === "create") {
    return transactionStatus || "UNPAID";
  }

  if (source === "check") {
    return transactionStatus;
  }

  return (
    transactionStatus ||
    getFirstNonEmptyStatus([
      payload?.status,
      payload?.payment_status,
      payload?.transaction_status,
      payload?.trx_status,
      payload?.status_transaksi,
      payload?.status_bayar,
    ])
  );
}

function mapTokopayStatus(rawStatus) {
  const normalizedStatus = normalizeCode(rawStatus);

  if (!normalizedStatus || normalizedStatus === "UNPAID" || normalizedStatus === "PENDING") {
    return {
      paymentStatus: "UNPAID",
      orderStatus: "UNPAID",
    };
  }

  if (
    normalizedStatus === "SUCCESS" ||
    normalizedStatus === "COMPLETED" ||
    normalizedStatus === "PAID"
  ) {
    return {
      paymentStatus: "PAID",
      orderStatus: "PAID",
    };
  }

  if (normalizedStatus === "EXPIRED") {
    return {
      paymentStatus: "EXPIRED",
      orderStatus: "EXPIRED",
    };
  }

  if (
    normalizedStatus === "FAILED" ||
    normalizedStatus === "CANCELLED" ||
    normalizedStatus === "CANCELED" ||
    normalizedStatus === "ERROR"
  ) {
    return {
      paymentStatus: "FAILED",
      orderStatus: "FAILED",
    };
  }

  if (normalizedStatus === "REFUNDED") {
    return {
      paymentStatus: "REFUNDED",
      orderStatus: "REFUNDED",
    };
  }

  return {
    paymentStatus: "UNPAID",
    orderStatus: "UNPAID",
  };
}

function mapBangjeffProviderStatus(rawStatusCode) {
  const normalizedStatus = normalizeCode(rawStatusCode);

  if (normalizedStatus === "SUCCESS") {
    return {
      providerStatus: "SUCCESS",
      orderStatus: "SUCCESS",
    };
  }

  if (normalizedStatus === "PROCESSING") {
    return {
      providerStatus: "PROCESSING",
      orderStatus: "PROCESSING",
    };
  }

  if (normalizedStatus === "REFUNDED" || normalizedStatus === "FAILED") {
    return {
      providerStatus: "FAILED",
      orderStatus: "FAILED",
    };
  }

  return {
    providerStatus: "UNKNOWN",
    orderStatus: "PROCESSING",
  };
}

module.exports = {
  buildInvoiceUrl,
  getTokopayExpireMinutes,
  getTokopayExpiryDate,
  getTokopayRawStatus,
  mapBangjeffProviderStatus,
  mapTokopayStatus,
  normalizeCode,
  resolveSiteBaseUrl,
  toStringValue,
};
