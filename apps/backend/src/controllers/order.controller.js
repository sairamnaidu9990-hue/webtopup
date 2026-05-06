const Game = require("../models/Game");
const Order = require("../models/Order");
const PaymentMethod = require("../models/PaymentMethod");
const Review = require("../models/Review");
const SiteSetting = require("../models/SiteSetting");
const Variant = require("../models/Variant");
const {
  checkoutBangjeff,
  getBangjeffOrderByInvoiceNumber,
  getBangjeffOrderByReferenceNumber,
} = require("../services/bangjeff.service");
const {
  checkTokopayTransaction,
  createTokopayTransaction,
  getTokopayConfig,
  verifyTokopayCallbackSignature,
} = require("../services/tokopay.service");
const { logError, logWarn } = require("../utils/appLogger");
const {
  buildInvoiceUrl,
  getTokopayExpiryDate,
  getTokopayRawStatus,
  mapBangjeffProviderStatus,
  mapTokopayStatus,
} = require("../utils/orderFlow");
const {
  buildWebhookUrls,
  getProductionReadinessWarnings,
} = require("../utils/deploymentConfig");
const { broadcastOrderUpdate } = require("../realtime/realtimeServer");
const {
  creditCustomerBalance,
  debitCustomerBalance,
} = require("../utils/customerBalance");
const { validatePromoForOrder } = require("../utils/promoCode");
const { serializeOrderReviewState } = require("./review.controller");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const ORDER_STATUSES = [
  "UNPAID",
  "PAID",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
  "EXPIRED",
];
const PAYMENT_STATUSES = ["UNPAID", "PAID", "FAILED", "EXPIRED", "REFUNDED"];
const PROVIDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "UNKNOWN",
];
const ORDER_TYPES = ["PURCHASE", "BALANCE_TOPUP"];
const PROCESSING_SUMMARY_STATUSES = ["PAID", "PROCESSING"];
const DEFAULT_ORDER_QUANTITY = 1;
const MAX_ORDER_QUANTITY = 10;
const KITAGG_BALANCE_PAYMENT_CODE = "KITAGG_BALANCE";
const DEFAULT_BANGJEFF_REGION = String(
  process.env.BANGJEFF_REGION || "ID"
).toUpperCase();
const BANGJEFF_REGION_ALIASES = {
  GLOBAL: DEFAULT_BANGJEFF_REGION,
  INDONESIA: "ID",
  INDO: "ID",
};

function toDigits(value) {
  return toStringValue(value).replace(/[^0-9]/g, "");
}

function parseTokopayTimestamp(value) {
  const normalized = toStringValue(value);

  if (!normalized) {
    return null;
  }

  const isoCandidate = normalized.includes("T")
    ? normalized
    : normalized.replace(" ", "T");
  const withOffset = /(?:Z|[+-]\d{2}:\d{2})$/i.test(isoCandidate)
    ? isoCandidate
    : `${isoCandidate}+07:00`;
  const parsedDate = new Date(withOffset);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function getTokopayChannelCode(paymentMethod) {
  return normalizeCode(paymentMethod?.gatewayChannelCode || paymentMethod?.code);
}

function buildTokopayCustomerName(order) {
  return (
    toStringValue(order.customerDisplay) ||
    toStringValue(order.gameSnapshot?.name) ||
    `Customer ${String(order.invoiceNumber || "").slice(-6)}`
  );
}

function buildTokopayCustomerEmail(order) {
  return (
    toStringValue(order.contactDetail?.email).toLowerCase() ||
    `order-${String(order.invoiceNumber || "").toLowerCase()}@example.com`
  );
}

function buildTokopayCustomerPhone(order) {
  return toDigits(
    `${toStringValue(order.contactDetail?.phoneCountryCode)}${toStringValue(
      order.contactDetail?.phoneNumber
    )}`
  );
}

function buildTokopayItems(order, invoiceUrl) {
  const quantity = normalizeOrderQuantity(order.quantity, DEFAULT_ORDER_QUANTITY);
  const baseName =
    toStringValue(order.variantSnapshot?.name) ||
    toStringValue(order.gameSnapshot?.name);

  return [
    {
      product_code:
        toStringValue(order.variantSnapshot?.providerCode) ||
        toStringValue(order.gameSnapshot?.code),
      name: quantity > 1 ? `${baseName} x${quantity}` : baseName,
      price: Number(
        order.price?.subtotalAfterDiscount ?? order.price?.sellPrice ?? 0
      ),
      product_url: invoiceUrl,
      image_url:
        toStringValue(order.variantSnapshot?.logo) ||
        toStringValue(order.gameSnapshot?.logo),
    },
  ];
}

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function normalizeOrderQuantity(value, fallback = DEFAULT_ORDER_QUANTITY) {
  return Math.min(
    Math.max(toPositiveInteger(value, fallback), DEFAULT_ORDER_QUANTITY),
    MAX_ORDER_QUANTITY
  );
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeBangjeffCheckoutRegion(value) {
  const normalized = normalizeCode(value);

  if (!normalized) {
    return DEFAULT_BANGJEFF_REGION;
  }

  return BANGJEFF_REGION_ALIASES[normalized] || normalized;
}

function getInvoicePrefix(siteName) {
  const sanitized = normalizeCode(siteName).replace(/[^A-Z0-9]/g, "");

  if (sanitized.length >= 3) {
    return sanitized.slice(0, 3);
  }

  if (sanitized.length > 0) {
    return sanitized.padEnd(3, "X");
  }

  return "WTX";
}

function toStringValue(value) {
  return String(value || "").trim();
}

function buildCustomerDisplay(customerInputs) {
  return customerInputs
    .map((item) => String(item?.value || "").trim())
    .filter(Boolean)
    .join(" / ");
}

function buildCustomerAccountSnapshot(customer) {
  if (!customer?._id) {
    return {
      customerId: null,
      username: "",
      name: "",
      email: "",
      phoneCountryCode: "+62",
      phoneNumber: "",
    };
  }

  return {
    customerId: customer._id,
    username: toStringValue(customer.username).toLowerCase(),
    name: toStringValue(customer.name),
    email: toStringValue(customer.email).toLowerCase(),
    phoneCountryCode: toStringValue(customer.phoneCountryCode) || "+62",
    phoneNumber: toStringValue(customer.phoneNumber).replace(/[^0-9]/g, ""),
  };
}

function normalizeOrderType(value) {
  const normalized = normalizeCode(value);
  return ORDER_TYPES.includes(normalized) ? normalized : "PURCHASE";
}

function isBalanceTopupOrder(order) {
  return normalizeOrderType(order?.orderType) === "BALANCE_TOPUP";
}

function isKitaggBalancePaymentCode(value) {
  return normalizeCode(value) === KITAGG_BALANCE_PAYMENT_CODE;
}

function buildKitaggBalancePaymentMethod(customer) {
  return {
    _id: "kitagg-balance",
    name: "Saldo KITAGG",
    code: KITAGG_BALANCE_PAYMENT_CODE,
    provider: "kitagg_balance",
    type: "ewallet",
    category: {
      name: "Saldo KITAGG",
      code: "KITAGG_BALANCE",
      order: 0,
      isActive: true,
    },
    logo: "",
    currency: "IDR",
    feeType: "fixed",
    feeValue: 0,
    feeFixed: 0,
    feePercent: 0,
    gatewayChannelCode: "",
    description: `Saldo tersedia Rp${Number(customer?.balance || 0).toLocaleString(
      "id-ID"
    )}`,
    accountHolderName: "",
    accountNumber: "",
  };
}

function isManualPaymentMethod(paymentMethod) {
  return toStringValue(paymentMethod?.provider || "manual").toLowerCase() === "manual";
}

async function saveOrderAndBroadcast(order, source = "system") {
  await order.save();
  broadcastOrderUpdate(order, source);
  return order;
}

async function finalizeBalanceTopupOrder(order, source = "balance-topup") {
  if (!isBalanceTopupOrder(order)) {
    return order;
  }

  if (normalizeCode(order.paymentStatus) !== "PAID") {
    return order;
  }

  if (order.customerBalanceAppliedAt) {
    if (normalizeCode(order.status) !== "SUCCESS") {
      order.status = "SUCCESS";
      order.providerStatus = "SUCCESS";
      order.providerMessage =
        toStringValue(order.providerMessage) || "Saldo KITAGG berhasil ditambahkan";
      order.completedAt = order.completedAt || new Date();
      await saveOrderAndBroadcast(order, source);
    }
    return order;
  }

  const customerId =
    order.customer || order.customerAccountSnapshot?.customerId || null;

  if (!customerId) {
    order.status = "FAILED";
    order.providerStatus = "FAILED";
    order.providerMessage = "Akun customer untuk topup saldo tidak ditemukan";
    order.failedAt = new Date();
    await saveOrderAndBroadcast(order, source);
    return order;
  }

  const creditResult = await creditCustomerBalance({
    customerId,
    amount: Number(order.price?.sellPrice || 0),
    currency: toStringValue(order.price?.currency || "IDR") || "IDR",
    source: "BALANCE_TOPUP",
    description: `Topup saldo dari invoice ${order.invoiceNumber}`,
    orderId: order._id,
    invoiceNumber: order.invoiceNumber,
  });

  order.customerBalanceAppliedAt = new Date();
  order.status = "SUCCESS";
  order.providerStatus = "SUCCESS";
  order.providerMessage = "Saldo KITAGG berhasil ditambahkan";
  order.notes = "";
  order.completedAt = order.completedAt || new Date();
  order.customerAccountSnapshot = {
    ...order.customerAccountSnapshot,
    customerId,
    username:
      toStringValue(creditResult.customer?.username) ||
      toStringValue(order.customerAccountSnapshot?.username),
    name:
      toStringValue(creditResult.customer?.name) ||
      toStringValue(order.customerAccountSnapshot?.name),
    email:
      toStringValue(creditResult.customer?.email) ||
      toStringValue(order.customerAccountSnapshot?.email),
    phoneCountryCode:
      toStringValue(creditResult.customer?.phoneCountryCode) ||
      toStringValue(order.customerAccountSnapshot?.phoneCountryCode) ||
      "+62",
    phoneNumber:
      toStringValue(creditResult.customer?.phoneNumber) ||
      toStringValue(order.customerAccountSnapshot?.phoneNumber),
  };

  await saveOrderAndBroadcast(order, source);
  return order;
}

async function payOrderWithCustomerBalance(order, customer) {
  if (!customer?._id) {
    throw new Error("Login diperlukan untuk memakai saldo KITAGG");
  }

  await debitCustomerBalance({
    customerId: customer._id,
    amount: Number(order.price?.totalAmount || 0),
    currency: toStringValue(order.price?.currency || "IDR") || "IDR",
    source: "ORDER_PAYMENT",
    description: `Pembayaran saldo untuk invoice ${order.invoiceNumber}`,
    orderId: order._id,
    invoiceNumber: order.invoiceNumber,
  });

  const now = new Date();
  order.paymentStatus = "PAID";
  order.paidAt = now;
  order.expiredAt = null;
  order.status = "PAID";
  order.notes = "";
  order.customerBalanceAppliedAt = now;
  order.paymentGateway = {
    provider: "kitagg_balance",
    channelCode: KITAGG_BALANCE_PAYMENT_CODE,
    transactionId: order.invoiceNumber,
    reference: order.invoiceNumber,
    payUrl: "",
    checkoutUrl: "",
    qrLink: "",
    qrString: "",
    virtualAccountNumber: "",
    instructionsHtml: "",
    rawStatus: "BALANCE_PAID",
    totalPaid: Number(order.price?.totalAmount || 0),
    netAmount: Number(order.price?.totalAmount || 0),
    expiresAt: null,
    updatedAt: now,
  };

  await saveOrderAndBroadcast(order, "balance-payment");
  return order;
}

function buildPaymentMethodSnapshot(paymentMethod) {
  const feeFixed = Number(
    paymentMethod?.feeFixed ??
      (paymentMethod?.feeType === "percent" ? 0 : paymentMethod?.feeValue || 0)
  );
  const feePercent = Number(
    paymentMethod?.feePercent ??
      (paymentMethod?.feeType === "percent" ? paymentMethod?.feeValue || 0 : 0)
  );

  return {
    name: toStringValue(paymentMethod?.name),
    code: normalizeCode(paymentMethod?.code),
    provider: toStringValue(paymentMethod?.provider || "manual"),
    type: toStringValue(paymentMethod?.type || "bank_transfer"),
    categoryName: toStringValue(paymentMethod?.category?.name),
    categoryCode: normalizeCode(paymentMethod?.category?.code),
    logo: toStringValue(paymentMethod?.logo),
    currency: normalizeCode(paymentMethod?.currency || "IDR"),
    feeType: toStringValue(paymentMethod?.feeType || "fixed"),
    feeValue: Number(paymentMethod?.feeValue || 0),
    feeFixed,
    feePercent,
    gatewayChannelCode: toStringValue(paymentMethod?.gatewayChannelCode),
    description: toStringValue(paymentMethod?.description),
    accountHolderName: toStringValue(paymentMethod?.accountHolderName),
    accountNumber: toStringValue(paymentMethod?.accountNumber),
  };
}

function buildPromoSnapshot(promoCode, discountAmount) {
  if (!promoCode) {
    return {
      promoId: null,
      title: "",
      code: "",
      description: "",
      discountType: "fixed",
      discountValue: 0,
      discountAmount: 0,
      minimumOrderAmount: 0,
      maxDailyUses: 0,
      applicableGameIds: [],
      applicableCategories: [],
    };
  }

  return {
    promoId: promoCode._id || null,
    title: toStringValue(promoCode.title),
    code: normalizeCode(promoCode.code),
    description: toStringValue(promoCode.description),
    discountType: toStringValue(promoCode.discountType || "fixed"),
    discountValue: Number(promoCode.discountValue || 0),
    discountAmount: Number(discountAmount || 0),
    minimumOrderAmount: Number(promoCode.minimumOrderAmount || 0),
    maxDailyUses: Number(promoCode.maxDailyUses || 0),
    applicableGameIds: Array.isArray(promoCode.applicableGameIds)
      ? promoCode.applicableGameIds
          .map((item) => toStringValue(item?._id || item))
          .filter(Boolean)
      : [],
    applicableCategories: Array.isArray(promoCode.applicableCategories)
      ? promoCode.applicableCategories
          .map((item) => toStringValue(item))
          .filter(Boolean)
      : [],
  };
}

function calculatePaymentFeeBreakdown(baseAmount, paymentMethod) {
  const normalizedBaseAmount = Number(baseAmount || 0);
  const feeFixed = Number(
    paymentMethod?.feeFixed ??
      (paymentMethod?.feeType === "percent" ? 0 : paymentMethod?.feeValue || 0)
  );
  const feePercentRate = Number(
    paymentMethod?.feePercent ??
      (paymentMethod?.feeType === "percent" ? paymentMethod?.feeValue || 0 : 0)
  );
  const percentFee = Math.ceil((normalizedBaseAmount * feePercentRate) / 100);

  return {
    fixedFee: feeFixed,
    percentFee,
    totalFee: feeFixed + percentFee,
  };
}

function applyBangjeffOrderData(order, payload) {
  const mappedStatus = mapBangjeffProviderStatus(payload?.statusCode);
  const now = new Date();

  order.providerInvoiceNumber = toStringValue(payload?.invoiceNumber);
  order.providerReferenceNumber = toStringValue(payload?.referenceNumber);
  order.providerStatus = mappedStatus.providerStatus;
  order.providerMessage = toStringValue(payload?.statusDesc);

  if (mappedStatus.orderStatus === "SUCCESS") {
    order.status = "SUCCESS";
    order.processingAt = order.processingAt || now;
    order.completedAt = now;
    order.failedAt = null;
    return;
  }

  if (mappedStatus.orderStatus === "FAILED") {
    order.status = "FAILED";
    order.failedAt = now;
    return;
  }

  order.status = "PROCESSING";
  order.processingAt = order.processingAt || now;
}

async function syncBangjeffOrderStatus(order) {
  if (
    toStringValue(order.provider).toLowerCase() !== "bangjeff" ||
    order.paymentStatus !== "PAID"
  ) {
    return order;
  }

  if (!["PAID", "PROCESSING"].includes(toStringValue(order.status).toUpperCase())) {
    return order;
  }

  try {
    let payload = null;

    if (toStringValue(order.providerInvoiceNumber)) {
      payload = await getBangjeffOrderByInvoiceNumber(order.providerInvoiceNumber);
    } else if (toStringValue(order.providerReferenceNumber || order.invoiceNumber)) {
      payload = await getBangjeffOrderByReferenceNumber(
        toStringValue(order.providerReferenceNumber || order.invoiceNumber)
      );
    }

    if (!payload) {
      return order;
    }

    applyBangjeffOrderData(order, payload);
    await saveOrderAndBroadcast(order, "bangjeff-sync");
  } catch {
    return order;
  }

  return order;
}

async function processBangjeffOrder(order) {
  try {
    const variantCode = toStringValue(order.variantSnapshot?.providerCode);
    const providerPrice = Number(
      order.variantSnapshot?.basePrice || order.price?.buyPrice || 0
    );
    const checkoutRegion = normalizeBangjeffCheckoutRegion(order.region);
    const quantity = normalizeOrderQuantity(order.quantity, DEFAULT_ORDER_QUANTITY);

    if (!variantCode) {
      throw new Error("Variant provider code belum tersedia");
    }

    if (providerPrice <= 0) {
      throw new Error("Harga dasar provider tidak valid");
    }

    const payload = await checkoutBangjeff({
      region: checkoutRegion,
      variantCode,
      referenceNumber: toStringValue(order.invoiceNumber),
      qty: quantity,
      price: {
        currency:
          toStringValue(order.variantSnapshot?.currency || order.price?.currency) ||
          "IDR",
        value: providerPrice,
      },
      inputs: Array.isArray(order.customerInputs)
        ? order.customerInputs.map((item) => ({
            name: toStringValue(item?.name || item?.title),
            value: toStringValue(item?.value),
          }))
        : [],
    });

    order.region = checkoutRegion;
    applyBangjeffOrderData(order, payload);
    await saveOrderAndBroadcast(order, "bangjeff-submit");

    return {
      ok: true,
      order,
    };
  } catch (error) {
    order.providerStatus = "FAILED";
    order.status = "FAILED";
    order.providerMessage = toStringValue(error.message);
    order.failedAt = new Date();
    await saveOrderAndBroadcast(order, "bangjeff-submit");

    logError({
      source: "backend",
      scope: "provider",
      message: "Gagal submit order ke BangJeff",
      meta: {
        invoiceNumber: order.invoiceNumber,
        provider: order.provider,
        variantCode: toStringValue(order.variantSnapshot?.providerCode),
        region: order.region,
      },
      error,
    });

    return {
      ok: false,
      order,
      error: toStringValue(error.message) || "Gagal kirim order ke BangJeff",
    };
  }
}

async function maybeProcessBangjeffAfterPaid(order) {
  if (toStringValue(order.provider).toLowerCase() !== "bangjeff") {
    return order;
  }

  if (toStringValue(order.paymentStatus).toUpperCase() !== "PAID") {
    return order;
  }

  if (toStringValue(order.status).toUpperCase() !== "PAID") {
    return order;
  }

  if (
    toStringValue(order.providerInvoiceNumber) ||
    toStringValue(order.providerReferenceNumber)
  ) {
    return order;
  }

  await processBangjeffOrder(order);
  return order;
}

function applyTokopayPaymentData(
  order,
  tokopayPayload,
  channelCode,
  fallbackExpiresAt,
  source
) {
  const data = tokopayPayload?.data || {};
  const rawStatus = getTokopayRawStatus(tokopayPayload, source);
  const mappedStatus = mapTokopayStatus(rawStatus);
  const paidTimestamp =
    parseTokopayTimestamp(data.updated_at) ||
    parseTokopayTimestamp(data.created_at) ||
    new Date();
  const expiredAt =
    parseTokopayTimestamp(data.expired_at) ||
    order.paymentGateway?.expiresAt ||
    fallbackExpiresAt ||
    null;

  order.paymentReferenceNumber =
    toStringValue(data.trx_id) ||
    toStringValue(tokopayPayload?.reference) ||
    toStringValue(order.paymentReferenceNumber);
  order.paymentGateway = {
    provider: "tokopay",
    channelCode:
      toStringValue(data.payment_channel) ||
      toStringValue(order.paymentGateway?.channelCode) ||
      channelCode,
    transactionId:
      toStringValue(data.trx_id) ||
      toStringValue(tokopayPayload?.reference) ||
      toStringValue(order.paymentGateway?.transactionId),
    reference:
      toStringValue(tokopayPayload?.reference) ||
      toStringValue(order.paymentGateway?.reference),
    payUrl:
      toStringValue(data.pay_url) || toStringValue(order.paymentGateway?.payUrl),
    checkoutUrl:
      toStringValue(data.checkout_url) ||
      toStringValue(order.paymentGateway?.checkoutUrl),
    qrLink:
      toStringValue(data.qr_link) || toStringValue(order.paymentGateway?.qrLink),
    qrString:
      toStringValue(data.qr_string) ||
      toStringValue(order.paymentGateway?.qrString),
    virtualAccountNumber:
      toStringValue(data.nomor_va) ||
      toStringValue(order.paymentGateway?.virtualAccountNumber),
    instructionsHtml:
      toStringValue(data.panduan_pembayaran) ||
      toStringValue(order.paymentGateway?.instructionsHtml),
    rawStatus,
    totalPaid: Number(
      data.total_bayar || order.paymentGateway?.totalPaid || order.price?.totalAmount || 0
    ),
    netAmount: Number(data.total_diterima || order.paymentGateway?.netAmount || 0),
    expiresAt: expiredAt,
    updatedAt: paidTimestamp,
  };

  order.paymentStatus = mappedStatus.paymentStatus;

  if (mappedStatus.orderStatus === "PAID") {
    if (order.status === "UNPAID") {
      order.status = "PAID";
    }

    order.paidAt = paidTimestamp;
    return;
  }

  if (mappedStatus.orderStatus === "EXPIRED") {
    order.status = "EXPIRED";
    order.expiredAt = expiredAt || paidTimestamp;
    return;
  }

  if (mappedStatus.orderStatus === "FAILED") {
    order.status = "FAILED";
    order.failedAt = paidTimestamp;
    return;
  }

  if (mappedStatus.orderStatus === "REFUNDED") {
    order.status = "REFUNDED";
  }
}

async function attachTokopayPaymentToOrder(order, paymentMethod, siteSetting) {
  const tokopayConfig = getTokopayConfig();

  if (!tokopayConfig.enabled) {
    return {
      order,
      warning: "Tokopay belum dikonfigurasi di backend",
    };
  }

  const channelCode = getTokopayChannelCode(paymentMethod);

  if (!channelCode) {
    return {
      order,
      warning: "Metode pembayaran belum memiliki kode channel Tokopay",
    };
  }

  const invoiceUrl = buildInvoiceUrl(siteSetting, order.invoiceNumber);
  const expiresAt = getTokopayExpiryDate();
  const productionWarnings = getProductionReadinessWarnings(
    siteSetting,
    tokopayConfig.enabled
  );

  if (process.env.NODE_ENV === "production" && productionWarnings.length > 0) {
    const warningMessage = productionWarnings.join(" ");

    order.paymentGateway = {
      ...order.paymentGateway,
      provider: "tokopay",
      channelCode,
      rawStatus: "CONFIG_ERROR",
      expiresAt,
    };
    order.notes = warningMessage;
    await saveOrderAndBroadcast(order, "tokopay-create");

    logWarn({
      source: "backend",
      scope: "deployment",
      message: "Konfigurasi production payment belum siap",
      meta: {
        invoiceNumber: order.invoiceNumber,
        warnings: productionWarnings,
        ...buildWebhookUrls(),
      },
    });

    return {
      order,
      warning: warningMessage,
    };
  }

  try {
    const tokopayPayload = await createTokopayTransaction({
      channelCode,
      refId: order.invoiceNumber,
      amount: Number(order.price?.totalAmount || order.price?.sellPrice || 0),
      customerName: buildTokopayCustomerName(order),
      customerEmail: buildTokopayCustomerEmail(order),
      customerPhone: buildTokopayCustomerPhone(order),
      redirectUrl: invoiceUrl,
      expiredTs: Math.floor(expiresAt.getTime() / 1000),
      items: buildTokopayItems(order, invoiceUrl),
    });

    applyTokopayPaymentData(
      order,
      tokopayPayload,
      channelCode,
      expiresAt,
      "create"
    );
    order.notes = "";
    await saveOrderAndBroadcast(order, "tokopay-create");

    return {
      order,
      warning: "",
    };
  } catch (error) {
    order.paymentGateway = {
      ...order.paymentGateway,
      provider: "tokopay",
      channelCode,
      rawStatus: "ERROR",
      expiresAt,
    };
    order.notes = toStringValue(error.message);
    await saveOrderAndBroadcast(order, "tokopay-create");

    logError({
      source: "backend",
      scope: "payment-gateway",
      message: "Gagal membuat transaksi Tokopay",
      meta: {
        invoiceNumber: order.invoiceNumber,
        channelCode,
        amount: Number(order.price?.totalAmount || order.price?.sellPrice || 0),
      },
      error,
    });

    return {
      order,
      warning: error.message,
    };
  }
}

async function syncTokopayPaymentStatus(order) {
  if (
    toStringValue(order.paymentGateway?.provider).toLowerCase() !== "tokopay" ||
    !toStringValue(order.paymentGateway?.channelCode)
  ) {
    return order;
  }

  if (!["UNPAID", "PAID", "PROCESSING"].includes(toStringValue(order.status))) {
    return order;
  }

  const tokopayConfig = getTokopayConfig();

  if (!tokopayConfig.enabled) {
    return order;
  }

  try {
    const tokopayPayload = await checkTokopayTransaction({
      refId: order.invoiceNumber,
      amount: Number(order.price?.totalAmount || order.price?.sellPrice || 0),
      methodCode: toStringValue(order.paymentGateway?.channelCode),
    });

    applyTokopayPaymentData(
      order,
      tokopayPayload,
      toStringValue(order.paymentGateway?.channelCode),
      order.paymentGateway?.expiresAt,
      "check"
    );
    await saveOrderAndBroadcast(order, "tokopay-check");
    await finalizeBalanceTopupOrder(order, "balance-topup-check");
    await maybeProcessBangjeffAfterPaid(order);
  } catch (error) {
    logWarn({
      source: "backend",
      scope: "payment-gateway",
      message: "Gagal sinkronisasi status Tokopay",
      meta: {
        invoiceNumber: order.invoiceNumber,
        channelCode: toStringValue(order.paymentGateway?.channelCode),
      },
      error,
    });
    return order;
  }

  return order;
}

function serializePublicOrder(order, review = null) {
  return {
    _id: order._id,
    invoiceNumber: order.invoiceNumber,
    orderType: normalizeOrderType(order.orderType),
    provider: order.provider,
    providerInvoiceNumber: order.providerInvoiceNumber,
    providerReferenceNumber: order.providerReferenceNumber,
    paymentReferenceNumber: order.paymentReferenceNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    providerStatus: order.providerStatus,
    quantity: normalizeOrderQuantity(order.quantity, DEFAULT_ORDER_QUANTITY),
    customerInputs: Array.isArray(order.customerInputs) ? order.customerInputs : [],
    customerDisplay: order.customerDisplay,
    paymentMethodCode: order.paymentMethodCode,
    paymentMethodName: order.paymentMethodName,
    contactDetail: order.contactDetail,
    paymentMethodSnapshot: order.paymentMethodSnapshot,
    paymentGateway: order.paymentGateway,
    price: order.price,
    promoSnapshot: order.promoSnapshot,
    region: order.region,
    gameSnapshot: order.gameSnapshot,
    variantSnapshot: order.variantSnapshot,
    review: serializeOrderReviewState(order, review),
    providerMessage: order.providerMessage,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function maskPhoneNumber(countryCode, phoneNumber) {
  const digits = toDigits(phoneNumber);

  if (!digits) {
    return "-";
  }

  const visibleLength = Math.min(3, digits.length);
  const maskedLength = Math.max(digits.length - visibleLength, 0);
  const maskedDigits = `${"*".repeat(maskedLength)}${digits.slice(-visibleLength)}`;

  return `${toStringValue(countryCode) || "+62"}${maskedDigits}`;
}

function maskInvoiceNumber(invoiceNumber) {
  const normalizedInvoice = toStringValue(invoiceNumber).toUpperCase();

  if (!normalizedInvoice) {
    return "-";
  }

  if (normalizedInvoice.length <= 6) {
    return normalizedInvoice;
  }

  return `${normalizedInvoice.slice(0, 3)}${"*".repeat(
    Math.max(normalizedInvoice.length - 6, 3)
  )}${normalizedInvoice.slice(-3)}`;
}

function serializeRecentPublicOrder(order) {
  return {
    _id: String(order._id || ""),
    invoiceNumber: maskInvoiceNumber(order.invoiceNumber),
    gameName:
      toStringValue(order.gameSnapshot?.name) ||
      toStringValue(order.variantSnapshot?.name) ||
      "-",
    variantName:
      toStringValue(order.variantSnapshot?.name) ||
      toStringValue(order.gameSnapshot?.name) ||
      "-",
    quantity: normalizeOrderQuantity(order.quantity, DEFAULT_ORDER_QUANTITY),
    phoneNumber: maskPhoneNumber(
      order.contactDetail?.phoneCountryCode,
      order.contactDetail?.phoneNumber
    ),
    currency: toStringValue(order.price?.currency) || "IDR",
    totalAmount: Number(order.price?.totalAmount || order.price?.sellPrice || 0),
    status: normalizeCode(order.status || order.paymentStatus || "UNPAID"),
    createdAt: order.createdAt,
  };
}

function isInputComplete(input, value) {
  const normalizedValue = toStringValue(value);

  if (!normalizedValue) {
    return false;
  }

  if (Number(input?.minLength || 0) > 0) {
    return normalizedValue.length >= Number(input.minLength);
  }

  return true;
}

function isInputTooLong(input, value) {
  const maxLength = Number(input?.maxLength || 0);

  if (maxLength <= 0) {
    return false;
  }

  return toStringValue(value).length > maxLength;
}

function isInputRegexValid(input, value) {
  const pattern = toStringValue(input?.regexValidation);

  if (!pattern) {
    return true;
  }

  try {
    return new RegExp(pattern).test(toStringValue(value));
  } catch {
    return true;
  }
}

function normalizeCustomerInputs(game, rawCustomerInputs) {
  const rawArray = Array.isArray(rawCustomerInputs) ? rawCustomerInputs : [];
  const rawMap = new Map(
    rawArray.map((item) => [
      String(item?.name || item?.title || "").trim(),
      toStringValue(item?.value),
    ])
  );

  return Array.isArray(game?.inputs)
    ? game.inputs.map((input) => {
        const inputName = toStringValue(input?.name);
        const inputTitle = toStringValue(input?.title);
        const key = inputName || inputTitle;

        return {
          name: inputName,
          title: inputTitle,
          type: toStringValue(input?.type) || "text",
          value: rawMap.get(key) || "",
        };
      })
    : [];
}

function normalizeEditableCustomerInputs(order, rawCustomerInputs) {
  const existingInputs = Array.isArray(order?.customerInputs)
    ? order.customerInputs
    : [];
  const rawArray = Array.isArray(rawCustomerInputs) ? rawCustomerInputs : [];

  if (existingInputs.length === 0) {
    return rawArray.map((item) => ({
      name: toStringValue(item?.name),
      title: toStringValue(item?.title),
      type: toStringValue(item?.type) || "text",
      value: toStringValue(item?.value),
    }));
  }

  return existingInputs.map((input, index) => ({
    name: toStringValue(input?.name),
    title: toStringValue(input?.title),
    type: toStringValue(input?.type) || "text",
    value: toStringValue(rawArray[index]?.value ?? input?.value),
  }));
}

function normalizeEditableContactDetail(rawContactDetail, fallbackContactDetail = {}) {
  const contactDetail =
    rawContactDetail && typeof rawContactDetail === "object" ? rawContactDetail : {};
  const fallback =
    fallbackContactDetail && typeof fallbackContactDetail === "object"
      ? fallbackContactDetail
      : {};

  return {
    email: toStringValue(contactDetail.email || fallback.email).toLowerCase(),
    phoneCountryCode:
      toStringValue(contactDetail.phoneCountryCode || fallback.phoneCountryCode) ||
      "+62",
    phoneNumber: toStringValue(contactDetail.phoneNumber || fallback.phoneNumber).replace(
      /[^0-9]/g,
      ""
    ),
  };
}

function serializeCustomerOrder(order) {
  return {
    _id: order._id,
    invoiceNumber: order.invoiceNumber,
    orderType: normalizeOrderType(order.orderType),
    status: order.status,
    paymentStatus: order.paymentStatus,
    providerStatus: order.providerStatus,
    quantity: normalizeOrderQuantity(order.quantity, DEFAULT_ORDER_QUANTITY),
    gameSnapshot: order.gameSnapshot,
    variantSnapshot: order.variantSnapshot,
    paymentMethodName: order.paymentMethodName,
    price: order.price,
    providerMessage: order.providerMessage,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function reconcileAdminEditedOrderTimestamps(order) {
  const now = new Date();
  const currentStatus = normalizeCode(order.status);

  if (currentStatus === "UNPAID") {
    order.processingAt = null;
    order.completedAt = null;
    order.failedAt = null;
    return;
  }

  if (currentStatus === "PAID") {
    order.paidAt = order.paidAt || now;
    order.processingAt = null;
    order.completedAt = null;
    order.failedAt = null;
    order.expiredAt = null;
    return;
  }

  if (currentStatus === "PROCESSING") {
    order.paidAt = order.paidAt || now;
    order.processingAt = order.processingAt || now;
    order.completedAt = null;
    order.failedAt = null;
    order.expiredAt = null;
    return;
  }

  if (currentStatus === "SUCCESS") {
    order.paidAt = order.paidAt || now;
    order.processingAt = order.processingAt || now;
    order.completedAt = order.completedAt || now;
    order.failedAt = null;
    order.expiredAt = null;
    return;
  }

  if (currentStatus === "FAILED") {
    order.failedAt = order.failedAt || now;
    order.completedAt = null;
    return;
  }

  if (currentStatus === "EXPIRED") {
    order.expiredAt = order.expiredAt || now;
    order.completedAt = null;
    order.failedAt = null;
    return;
  }

  if (currentStatus === "REFUNDED") {
    order.completedAt = null;
    order.failedAt = null;
  }
}

function reconcileAdminEditedPaymentTimestamps(order) {
  const now = new Date();
  const currentPaymentStatus = normalizeCode(order.paymentStatus);

  if (currentPaymentStatus === "UNPAID") {
    order.paidAt = null;
    return;
  }

  if (currentPaymentStatus === "PAID") {
    order.paidAt = order.paidAt || now;
    order.expiredAt = null;
    return;
  }

  if (currentPaymentStatus === "EXPIRED") {
    order.expiredAt = order.expiredAt || now;
    order.paidAt = null;
    return;
  }

  if (currentPaymentStatus === "FAILED") {
    order.paidAt = null;
    return;
  }
}

function resetBangjeffOrderForRetry(order) {
  const isPaymentPaid = normalizeCode(order.paymentStatus) === "PAID";

  order.providerInvoiceNumber = "";
  order.providerReferenceNumber = "";
  order.providerStatus = "PENDING";
  order.providerMessage = "";
  order.notes = "";
  order.processingAt = null;
  order.completedAt = null;
  order.failedAt = null;
  order.expiredAt = isPaymentPaid ? null : order.expiredAt;
  order.status = isPaymentPaid ? "PAID" : "UNPAID";
}

async function generateInvoiceNumber() {
  const siteSetting = await SiteSetting.findOne({}, { siteName: 1 }).lean();
  const prefix = getInvoicePrefix(siteSetting?.siteName);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `${prefix}${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
    const exists = await Order.exists({ invoiceNumber: candidate });

    if (!exists) {
      return candidate;
    }
  }

  throw new Error("Gagal membuat invoice order");
}

async function buildSummary() {
  const purchaseFilter = { orderType: "PURCHASE" };
  const [totalOrders, successOrders, failedOrders, processingOrders] =
    await Promise.all([
      Order.countDocuments(purchaseFilter),
      Order.countDocuments({ ...purchaseFilter, status: "SUCCESS" }),
      Order.countDocuments({ ...purchaseFilter, status: "FAILED" }),
      Order.countDocuments({
        ...purchaseFilter,
        status: { $in: PROCESSING_SUMMARY_STATUSES },
      }),
    ]);

  return {
    totalOrders,
    successOrders,
    failedOrders,
    processingOrders,
  };
}

async function buildDashboardSummary() {
  const [aggregateResult, recentOrders] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          orderType: "PURCHASE",
          status: "SUCCESS",
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalBasePrice: { $sum: { $ifNull: ["$price.buyPrice", 0] } },
          totalSellPrice: {
            $sum: {
              $ifNull: ["$price.subtotalAfterDiscount", "$price.sellPrice"],
            },
          },
          totalPromoDiscount: {
            $sum: { $ifNull: ["$price.promoDiscount", 0] },
          },
          totalPaymentFee: {
            $sum: { $ifNull: ["$price.paymentFee", 0] },
          },
          totalProfit: {
            $sum: {
              $subtract: [
                {
                  $max: [
                    {
                      $ifNull: [
                        "$price.subtotalAfterDiscount",
                        {
                          $subtract: [
                            { $ifNull: ["$price.sellPrice", 0] },
                            { $ifNull: ["$price.promoDiscount", 0] },
                          ],
                        },
                      ],
                    },
                    0,
                  ],
                },
                { $ifNull: ["$price.buyPrice", 0] },
              ],
            },
          },
        },
      },
    ]),
    Order.find({ orderType: "PURCHASE" })
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        [
          "invoiceNumber",
          "gameSnapshot",
          "variantSnapshot",
          "paymentMethodName",
          "paymentStatus",
          "providerStatus",
          "status",
          "price",
          "createdAt",
        ].join(" ")
      )
      .lean(),
  ]);

  const metrics = aggregateResult[0] || {};

  return {
    totalOrders: Number(metrics.totalOrders || 0),
    totalBasePrice: Number(metrics.totalBasePrice || 0),
    totalSellPrice: Number(metrics.totalSellPrice || 0),
    totalPromoDiscount: Number(metrics.totalPromoDiscount || 0),
    totalPaymentFee: Number(metrics.totalPaymentFee || 0),
    totalProfit: Number(metrics.totalProfit || 0),
    recentOrders,
  };
}

async function getPublicOrderByInvoice(req, res) {
  try {
    const invoiceNumber = normalizeCode(req.params.invoiceNumber);

    if (!invoiceNumber) {
      return res.status(400).json({
        message: "Invoice order wajib diisi",
      });
    }

    const order = await Order.findOne({ invoiceNumber });

    if (!order) {
      return res.status(404).json({
        message: "Invoice tidak ditemukan",
      });
    }

    await syncTokopayPaymentStatus(order);
    await finalizeBalanceTopupOrder(order, "balance-topup-public");
    await syncBangjeffOrderStatus(order);
    const review = await Review.findOne({ order: order._id }).lean();

    return res.status(200).json({
      order: serializePublicOrder(order, review),
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "order",
      message: "Error ambil invoice order publik",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      meta: {
        invoiceNumber: req.params?.invoiceNumber,
      },
      error,
    });
    return res.status(500).json({
      message: "Error ambil invoice order",
      error: error.message,
    });
  }
}

async function getRecentPublicOrders(req, res) {
  try {
    const limit = Math.min(toPositiveInteger(req.query.limit, 10), 20);
    const items = await Order.find({ orderType: "PURCHASE" })
      .sort({ createdAt: -1 })
      .limit(limit);

    await Promise.all(
      items.map(async (order) => {
        await syncTokopayPaymentStatus(order);
        await maybeProcessBangjeffAfterPaid(order);
        await syncBangjeffOrderStatus(order);
      })
    );

    return res.status(200).json({
      items: items.map((order) => serializeRecentPublicOrder(order)),
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "order",
      message: "Error ambil transaksi terbaru publik",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      error,
    });
    return res.status(500).json({
      message: "Error ambil transaksi terbaru",
      error: error.message,
    });
  }
}

async function getCurrentCustomerOrders(req, res) {
  try {
    const limit = Math.min(toPositiveInteger(req.query.limit, 50), MAX_LIMIT);
    const items = await Order.find({ customer: req.customer._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    await Promise.all(
      items.map(async (order) => {
        await syncTokopayPaymentStatus(order);
        await finalizeBalanceTopupOrder(order, "balance-topup-customer");
        await maybeProcessBangjeffAfterPaid(order);
        await syncBangjeffOrderStatus(order);
      })
    );

    return res.status(200).json({
      items: items.map((order) => serializeCustomerOrder(order)),
      limit,
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "order",
      message: "Error ambil riwayat order customer",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      meta: {
        customerId: req.customer?._id,
      },
      error,
    });
    return res.status(500).json({
      message: "Error ambil riwayat transaksi customer",
      error: error.message,
    });
  }
}

async function createOrderDraft(req, res) {
  let order = null;
  let isBalancePayment = false;

  try {
    const {
      gameCode,
      variantId,
      paymentMethodCode,
      promoCode,
      quantity,
      customerInputs = [],
      contactDetail = {},
    } = req.body || {};

    const normalizedGameCode = normalizeCode(gameCode);
    const normalizedVariantId = toStringValue(variantId);
    const normalizedPaymentMethodCode = normalizeCode(paymentMethodCode);
    const normalizedPromoCode = normalizeCode(promoCode);
    const normalizedQuantity = normalizeOrderQuantity(quantity, DEFAULT_ORDER_QUANTITY);
    isBalancePayment = isKitaggBalancePaymentCode(normalizedPaymentMethodCode);
    const normalizedPhoneNumber = toStringValue(contactDetail.phoneNumber).replace(
      /[^0-9]/g,
      ""
    );
    const normalizedPhoneCountryCode =
      toStringValue(contactDetail.phoneCountryCode) || "+62";
    const normalizedEmail = toStringValue(contactDetail.email).toLowerCase();

    if (!normalizedGameCode || !normalizedVariantId) {
      return res.status(400).json({
        message: "Game dan variant wajib dipilih",
      });
    }

    if (!normalizedPaymentMethodCode) {
      return res.status(400).json({
        message: "Metode pembayaran wajib dipilih",
      });
    }

    if (!normalizedPhoneNumber) {
      return res.status(400).json({
        message: "Nomor kontak wajib diisi",
      });
    }

    if (isBalancePayment && !req.customer?._id) {
      return res.status(401).json({
        message: "Login diperlukan untuk memakai saldo KITAGG",
      });
    }

    const [game, variant, paymentMethodDocument] = await Promise.all([
      Game.findOne({ code: normalizedGameCode, status: "ACTIVE" }),
      Variant.findOne({
        _id: normalizedVariantId,
        status: "ACTIVE",
        isActive: true,
      }).populate("game", "code"),
      isBalancePayment
        ? Promise.resolve(null)
        : PaymentMethod.findOne({
            code: normalizedPaymentMethodCode,
            isActive: true,
          }).populate("category", "name code isActive order"),
    ]);

    const paymentMethod = isBalancePayment
      ? buildKitaggBalancePaymentMethod(req.customer)
      : paymentMethodDocument;

    if (!game) {
      return res.status(404).json({
        message: "Game tidak ditemukan atau sedang tidak aktif",
      });
    }

    if (!variant) {
      return res.status(404).json({
        message: "Variant tidak ditemukan atau sedang tidak aktif",
      });
    }

    if (String(variant.game?._id || variant.game || "") !== String(game._id)) {
      return res.status(400).json({
        message: "Variant tidak sesuai dengan game yang dipilih",
      });
    }

    if (!paymentMethod) {
      return res.status(404).json({
        message: "Metode pembayaran tidak ditemukan atau sedang tidak aktif",
      });
    }

    if (paymentMethod.category && paymentMethod.category.isActive === false) {
      return res.status(400).json({
        message: "Kategori metode pembayaran sedang tidak aktif",
      });
    }

    if (
      isManualPaymentMethod(paymentMethod) &&
      (!toStringValue(paymentMethod.accountHolderName) ||
        !toStringValue(paymentMethod.accountNumber))
    ) {
      return res.status(400).json({
        message: "Metode pembayaran manual belum memiliki nama rekening atau nomor rekening",
      });
    }

    const normalizedInputs = normalizeCustomerInputs(game, customerInputs);
    const isVoucherCategory =
      toStringValue(game.category).toLowerCase() === "voucher";

    if (!isVoucherCategory && normalizedInputs.length > 0) {
      const invalidInput = normalizedInputs.find((input, index) => {
        const gameInput = game.inputs[index];

        return (
          !isInputComplete(gameInput, input.value) ||
          isInputTooLong(gameInput, input.value) ||
          !isInputRegexValid(gameInput, input.value)
        );
      });

      if (invalidInput) {
        return res.status(400).json({
          message: `Input ${invalidInput.title || invalidInput.name || "akun"} belum valid`,
        });
      }
    }

    const invoiceNumber = await generateInvoiceNumber();
    const unitSellPrice = Number(variant.price || 0);
    const unitBuyPrice = Number(variant.basePrice || 0);
    const sellPrice = unitSellPrice * normalizedQuantity;
    const buyPrice = unitBuyPrice * normalizedQuantity;
    let promoValidationResult = null;

    if (normalizedPromoCode) {
      promoValidationResult = await validatePromoForOrder({
        code: normalizedPromoCode,
        gameId: String(game._id || ""),
        category: toStringValue(game.category),
        subtotal: sellPrice,
      });

      if (!promoValidationResult.ok) {
        return res.status(promoValidationResult.status || 400).json({
          message:
            promoValidationResult.message ||
            "Kode promo tidak bisa digunakan untuk pesanan ini",
        });
      }
    }

    const promoDiscount = Number(promoValidationResult?.discountAmount || 0);
    const subtotalAfterDiscount = Math.max(sellPrice - promoDiscount, 0);
    const paymentFeeBreakdown = calculatePaymentFeeBreakdown(
      subtotalAfterDiscount,
      paymentMethod
    );
    const paymentFee = paymentFeeBreakdown.totalFee;
    const totalAmount = subtotalAfterDiscount + paymentFee;
    const profit = subtotalAfterDiscount - buyPrice;

    if (isBalancePayment && Number(req.customer?.balance || 0) < totalAmount) {
      return res.status(400).json({
        message: `Saldo KITAGG tidak cukup. Saldo tersedia Rp${Number(
          req.customer?.balance || 0
        ).toLocaleString("id-ID")}`,
      });
    }

    const siteSetting = await SiteSetting.findOne(
      {},
      { siteName: 1, siteDomain: 1 }
    ).lean();
    const paymentMethodSnapshot = buildPaymentMethodSnapshot(paymentMethod);
    const promoSnapshot = buildPromoSnapshot(
      promoValidationResult?.promoCode || null,
      promoDiscount
    );

    order = await Order.create({
      invoiceNumber,
      provider: toStringValue(game.syncSource) || "bangjeff",
      game: game._id,
      variant: variant._id,
      customer: req.customer?._id || null,
      quantity: normalizedQuantity,
      gameSnapshot: {
        name: toStringValue(game.name),
        code: normalizeCode(game.code),
        provider: toStringValue(game.provider),
        category: toStringValue(game.category),
        logo: toStringValue(game.logo),
      },
      variantSnapshot: {
        name: toStringValue(variant.name),
        providerCode: toStringValue(variant.providerCode),
        logo: toStringValue(variant.logo),
        currency: toStringValue(variant.currency) || "IDR",
        basePrice: unitBuyPrice,
        sellPrice: unitSellPrice,
      },
      customerInputs: normalizedInputs,
      customerDisplay: buildCustomerDisplay(normalizedInputs),
      contactDetail: {
        email: normalizedEmail,
        phoneCountryCode: normalizedPhoneCountryCode,
        phoneNumber: normalizedPhoneNumber,
      },
      customerAccountSnapshot: buildCustomerAccountSnapshot(req.customer),
      paymentMethodSnapshot,
      region: normalizeBangjeffCheckoutRegion(variant.region),
      price: {
        currency: toStringValue(variant.currency) || "IDR",
        buyPrice,
        sellPrice,
        profit,
        promoDiscount,
        subtotalAfterDiscount,
        paymentFee,
        paymentFeeFixed: paymentFeeBreakdown.fixedFee,
        paymentFeePercent: paymentFeeBreakdown.percentFee,
        totalAmount,
      },
      promoSnapshot,
      paymentMethodCode: paymentMethod.code,
      paymentMethodName: paymentMethod.name,
      paymentStatus: "UNPAID",
      providerStatus: "PENDING",
      status: "UNPAID",
    });

    let warning = "";

    if (isBalancePayment) {
      await payOrderWithCustomerBalance(order, req.customer);
      await maybeProcessBangjeffAfterPaid(order);
    } else if (!isManualPaymentMethod(paymentMethod)) {
      const result = await attachTokopayPaymentToOrder(
        order,
        paymentMethod,
        siteSetting
      );
      warning = result.warning || "";
    }

    return res.status(201).json({
      message: "Order draft berhasil dibuat",
      order: serializePublicOrder(order),
      warning: warning || undefined,
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "order",
      message: "Error membuat order draft",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      meta: {
        gameCode: req.body?.gameCode,
        variantId: req.body?.variantId,
        paymentMethodCode: req.body?.paymentMethodCode,
        promoCode: req.body?.promoCode,
        quantity: req.body?.quantity,
      },
      error,
    });

    if (
      isBalancePayment &&
      order?._id &&
      normalizeCode(order.paymentStatus) !== "PAID"
    ) {
      await Order.findByIdAndDelete(order._id).catch(() => null);
    }

    return res.status(500).json({
      message: "Error membuat order draft",
      error: error.message,
    });
  }
}

async function updateOrderByAdmin(req, res) {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order tidak ditemukan",
      });
    }

    const {
      customerInputs,
      contactDetail,
      paymentStatus,
      status,
      providerStatus,
      providerMessage,
      notes,
    } = req.body || {};

    if (customerInputs !== undefined) {
      order.customerInputs = normalizeEditableCustomerInputs(order, customerInputs);
      order.customerDisplay = buildCustomerDisplay(order.customerInputs);
    }

    if (contactDetail !== undefined) {
      const normalizedContactDetail = normalizeEditableContactDetail(
        contactDetail,
        order.contactDetail
      );

      if (!normalizedContactDetail.phoneNumber) {
        return res.status(400).json({
          message: "Nomor kontak wajib diisi",
        });
      }

      order.contactDetail = normalizedContactDetail;
    }

    if (paymentStatus !== undefined) {
      const normalizedPaymentStatus = normalizeCode(paymentStatus);

      if (!PAYMENT_STATUSES.includes(normalizedPaymentStatus)) {
        return res.status(400).json({
          message: "Status pembayaran tidak valid",
        });
      }

      order.paymentStatus = normalizedPaymentStatus;
    }

    if (status !== undefined) {
      const normalizedStatus = normalizeCode(status);

      if (!ORDER_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({
          message: "Status order tidak valid",
        });
      }

      order.status = normalizedStatus;
    }

    if (providerStatus !== undefined) {
      const normalizedProviderStatus = normalizeCode(providerStatus);

      if (!PROVIDER_STATUSES.includes(normalizedProviderStatus)) {
        return res.status(400).json({
          message: "Status provider tidak valid",
        });
      }

      order.providerStatus = normalizedProviderStatus;
    }

    if (providerMessage !== undefined) {
      order.providerMessage = toStringValue(providerMessage);
    }

    if (notes !== undefined) {
      order.notes = toStringValue(notes);
    }

    if (paymentStatus !== undefined) {
      reconcileAdminEditedPaymentTimestamps(order);
    }

    if (status !== undefined) {
      reconcileAdminEditedOrderTimestamps(order);
    }

    await saveOrderAndBroadcast(order, "admin-update");

    return res.status(200).json({
      message: "Perubahan order berhasil disimpan",
      order,
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "order",
      message: "Error update order oleh admin",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      meta: {
        orderId: req.params?.id,
      },
      error,
    });

    return res.status(500).json({
      message: "Error update order",
      error: error.message,
    });
  }
}

async function markManualOrderAsPaid(req, res) {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order tidak ditemukan",
      });
    }

    const paymentProvider = toStringValue(
      order.paymentMethodSnapshot?.provider || "manual"
    ).toLowerCase();

    if (paymentProvider !== "manual") {
      return res.status(400).json({
        message: "Aksi ini hanya tersedia untuk metode pembayaran manual",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({
        message: "Order ini sudah ditandai paid",
      });
    }

    if (["SUCCESS", "PROCESSING"].includes(toStringValue(order.status).toUpperCase())) {
      return res.status(400).json({
        message: "Order ini sudah sedang atau selesai diproses",
      });
    }

    const now = new Date();

    order.paymentStatus = "PAID";
    order.paidAt = now;
    order.expiredAt = null;
    order.status = "PAID";
    order.notes = "";
    order.paymentGateway = {
      ...order.paymentGateway,
      provider: "manual",
      rawStatus: "MANUAL_PAID",
      updatedAt: now,
    };
    await saveOrderAndBroadcast(order, "manual-paid");

    if (isBalanceTopupOrder(order)) {
      await finalizeBalanceTopupOrder(order, "balance-topup-manual");
    }

    return res.status(200).json({
      message:
        isBalanceTopupOrder(order)
          ? "Pembayaran topup saldo berhasil ditandai paid dan saldo user sudah ditambahkan."
          : "Pembayaran berhasil ditandai paid. Gunakan aksi kirim ulang order jika ingin submit ke provider.",
      order,
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "order",
      message: "Error update status pembayaran manual",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      meta: {
        orderId: req.params?.id,
      },
      error,
    });
    return res.status(500).json({
      message: "Error update status pembayaran manual",
      error: error.message,
    });
  }
}

async function resendOrderCallback(req, res) {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order tidak ditemukan",
      });
    }

    const before = {
      paymentStatus: toStringValue(order.paymentStatus),
      status: toStringValue(order.status),
      providerStatus: toStringValue(order.providerStatus),
      providerMessage: toStringValue(order.providerMessage),
      providerInvoiceNumber: toStringValue(order.providerInvoiceNumber),
      providerReferenceNumber: toStringValue(order.providerReferenceNumber),
    };

    await syncTokopayPaymentStatus(order);
    await maybeProcessBangjeffAfterPaid(order);
    await syncBangjeffOrderStatus(order);

    const after = {
      paymentStatus: toStringValue(order.paymentStatus),
      status: toStringValue(order.status),
      providerStatus: toStringValue(order.providerStatus),
      providerMessage: toStringValue(order.providerMessage),
      providerInvoiceNumber: toStringValue(order.providerInvoiceNumber),
      providerReferenceNumber: toStringValue(order.providerReferenceNumber),
    };

    const hasChanges = Object.keys(before).some((key) => before[key] !== after[key]);

    return res.status(200).json({
      message: hasChanges
        ? "Callback dan status order berhasil disinkronkan ulang"
        : "Sinkronisasi callback selesai. Belum ada perubahan status terbaru.",
      order,
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "order",
      message: "Error kirim ulang callback order",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      meta: {
        orderId: req.params?.id,
      },
      error,
    });

    return res.status(500).json({
      message: "Error kirim ulang callback order",
      error: error.message,
    });
  }
}

async function resendOrderToProvider(req, res) {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order tidak ditemukan",
      });
    }

    if (toStringValue(order.provider).toLowerCase() !== "bangjeff") {
      return res.status(400).json({
        message:
          "Saat ini kirim ulang order otomatis baru tersedia untuk provider BangJeff",
      });
    }

    if (normalizeCode(order.paymentStatus) !== "PAID") {
      return res.status(400).json({
        message: "Pembayaran harus PAID sebelum order bisa dikirim ulang",
      });
    }

    if (
      ["SUCCESS", "PROCESSING"].includes(normalizeCode(order.status))
    ) {
      return res.status(400).json({
        message: "Order ini sudah sedang diproses atau sudah berhasil",
      });
    }

    resetBangjeffOrderForRetry(order);
    await saveOrderAndBroadcast(order, "provider-retry");

    const result = await processBangjeffOrder(order);

    if (!result.ok) {
      return res.status(200).json({
        message: "Order gagal diproses ulang ke BangJeff",
        warning: result.error,
        order: result.order,
      });
    }

    return res.status(200).json({
      message: "Order berhasil dikirim ulang ke BangJeff",
      order: result.order,
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "provider",
      message: "Error kirim ulang order ke provider",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      meta: {
        orderId: req.params?.id,
      },
      error,
    });

    return res.status(500).json({
      message: "Error kirim ulang order ke provider",
      error: error.message,
    });
  }
}

async function tokopayCallback(req, res) {
  try {
    const payload =
      req.method === "GET" ? req.query || {} : req.body || {};
    const invoiceNumber = normalizeCode(payload.reff_id || payload.ref_id);
    const signature = toStringValue(payload.signature);

    if (!invoiceNumber || !signature) {
      return res.status(400).json({
        status: false,
        message: "Payload callback Tokopay tidak lengkap",
      });
    }

    if (!verifyTokopayCallbackSignature(signature, invoiceNumber)) {
      return res.status(400).json({
        status: false,
        message: "Signature Tokopay tidak valid",
      });
    }

    const order = await Order.findOne({ invoiceNumber });

    if (!order) {
      return res.status(404).json({
        status: false,
        message: "Invoice order tidak ditemukan",
      });
    }

    applyTokopayPaymentData(
      order,
      payload,
      toStringValue(payload?.data?.payment_channel) ||
        toStringValue(order.paymentGateway?.channelCode),
      order.paymentGateway?.expiresAt,
      "webhook"
    );
    order.notes = "";
    await saveOrderAndBroadcast(order, "tokopay-callback");
    await finalizeBalanceTopupOrder(order, "balance-topup-callback");
    await maybeProcessBangjeffAfterPaid(order);

    return res.status(200).json({
      status: true,
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "payment-gateway",
      message: "Error proses callback Tokopay",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      meta: {
        invoiceNumber: req.body?.reff_id || req.query?.reff_id || req.body?.ref_id || req.query?.ref_id,
      },
      error,
    });
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
}

async function bangjeffCallback(req, res) {
  try {
    const payload = req.method === "GET" ? req.query || {} : req.body || {};
    const referenceNumber = normalizeCode(
      payload.referenceNumber || payload.reference_number
    );
    const providerInvoiceNumber = toStringValue(
      payload.invoiceNumber || payload.invoice_number
    );

    if (!referenceNumber && !providerInvoiceNumber) {
      return res.status(200).json({
        status: true,
        message: "BangJeff callback endpoint ready",
      });
    }

    const filters = [];

    if (referenceNumber) {
      filters.push({ invoiceNumber: referenceNumber });
      filters.push({ providerReferenceNumber: referenceNumber });
    }

    if (providerInvoiceNumber) {
      filters.push({ providerInvoiceNumber });
    }

    const order = filters.length
      ? await Order.findOne({
          $or: filters,
        })
      : null;

    if (!order) {
      logWarn({
        source: "backend",
        scope: "provider",
        message: "BangJeff callback diterima tetapi order tidak ditemukan",
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl || req.url || "",
        statusCode: 200,
        meta: {
          referenceNumber,
          providerInvoiceNumber,
        },
      });

      return res.status(200).json({
        status: true,
        message: "Order tidak ditemukan",
      });
    }

    applyBangjeffOrderData(order, payload);
    await saveOrderAndBroadcast(order, "bangjeff-callback");

    return res.status(200).json({
      status: true,
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "provider",
      message: "Error proses callback BangJeff",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      meta: {
        referenceNumber:
          req.body?.referenceNumber ||
          req.query?.referenceNumber ||
          req.body?.reference_number ||
          req.query?.reference_number,
      },
      error,
    });

    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
}

async function getOrders(req, res) {
  try {
    const page = toPositiveInteger(req.query.page, 1);
    const requestedLimit = toPositiveInteger(req.query.limit, DEFAULT_LIMIT);
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "ALL").trim().toUpperCase();
    const paymentStatus = String(req.query.paymentStatus || "ALL")
      .trim()
      .toUpperCase();

    const filter = {};

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { invoiceNumber: regex },
        { providerInvoiceNumber: regex },
        { providerReferenceNumber: regex },
        { paymentReferenceNumber: regex },
        { "gameSnapshot.name": regex },
        { "gameSnapshot.code": regex },
        { "variantSnapshot.name": regex },
        { "variantSnapshot.providerCode": regex },
        { customerDisplay: regex },
        { "contactDetail.email": regex },
        { "contactDetail.phoneNumber": regex },
        { paymentMethodName: regex },
      ];
    }

    if (ORDER_STATUSES.includes(status)) {
      filter.status = status;
    }

    if (PAYMENT_STATUSES.includes(paymentStatus)) {
      filter.paymentStatus = paymentStatus;
    }

    const [items, totalItems] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    await Promise.all(
      items.map(async (order) => {
        await syncTokopayPaymentStatus(order);
        await maybeProcessBangjeffAfterPaid(order);
        await syncBangjeffOrderStatus(order);
      })
    );

    const summary = await buildSummary();

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return res.status(200).json({
      items,
      page,
      limit,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
      summary,
    });
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "order",
      message: "Error ambil data order admin",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      error,
    });
    return res.status(500).json({
      message: "Error ambil data order",
      error: error.message,
    });
  }
}

async function getOrderDashboard(req, res) {
  try {
    const dashboard = await buildDashboardSummary();

    return res.status(200).json(dashboard);
  } catch (error) {
    res.locals.skipRequestLog = true;
    logError({
      source: "backend",
      scope: "order",
      message: "Error ambil ringkasan dashboard order",
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url || "",
      statusCode: 500,
      error,
    });
    return res.status(500).json({
      message: "Error ambil ringkasan dashboard order",
      error: error.message,
    });
  }
}

module.exports = {
  bangjeffCallback,
  createOrderDraft,
  getCurrentCustomerOrders,
  getOrderDashboard,
  getOrders,
  getPublicOrderByInvoice,
  getRecentPublicOrders,
  markManualOrderAsPaid,
  resendOrderCallback,
  resendOrderToProvider,
  tokopayCallback,
  updateOrderByAdmin,
};
