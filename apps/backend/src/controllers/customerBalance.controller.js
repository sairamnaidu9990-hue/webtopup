const Customer = require("../models/Customer");
const Order = require("../models/Order");
const PaymentMethod = require("../models/PaymentMethod");
const CustomerBalanceTransaction = require("../models/CustomerBalanceTransaction");
const SiteSetting = require("../models/SiteSetting");
const { createTokopayTransaction, getTokopayConfig } = require("../services/tokopay.service");
const { buildInvoiceUrl, getTokopayExpiryDate } = require("../utils/orderFlow");
const { buildWebhookUrls, getProductionReadinessWarnings } = require("../utils/deploymentConfig");
const { logError, logWarn } = require("../utils/appLogger");
const {
  creditCustomerBalance,
  debitCustomerBalance,
  serializeCustomerBalanceTransaction,
} = require("../utils/customerBalance");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MIN_TOPUP_AMOUNT = 1000;
const MAX_TOPUP_AMOUNT = 10000000;

function toStringValue(value) {
  return String(value || "").trim();
}

function normalizeCode(value) {
  return toStringValue(value).toUpperCase();
}

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
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

function buildWalletTopupInvoiceNumber(siteName) {
  return `${getInvoicePrefix(siteName)}W${Date.now()}${Math.floor(
    100 + Math.random() * 900
  )}`;
}

function isManualPaymentMethod(paymentMethod) {
  return toStringValue(paymentMethod?.provider || "manual").toLowerCase() === "manual";
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

function buildTokopayCustomerName(customer) {
  return (
    toStringValue(customer?.name) ||
    toStringValue(customer?.username) ||
    `Customer ${String(customer?._id || "").slice(-6)}`
  );
}

function buildTokopayCustomerPhone(customer) {
  return String(
    `${toStringValue(customer?.phoneCountryCode)}${toStringValue(
      customer?.phoneNumber
    )}`
  ).replace(/[^0-9]/g, "");
}

function buildWalletTopupOrderPayload({
  customer,
  siteSetting,
  paymentMethod,
  amount,
}) {
  const paymentFeeBreakdown = calculatePaymentFeeBreakdown(amount, paymentMethod);
  const totalAmount = amount + paymentFeeBreakdown.totalFee;
  const invoiceNumber = buildWalletTopupInvoiceNumber(siteSetting.siteName);

  return {
    invoiceNumber,
    orderType: "BALANCE_TOPUP",
    provider: "internal",
    customer: customer._id,
    quantity: 1,
    gameSnapshot: {
      name: "Top Up Saldo KITAGG",
      code: "KITAGG_BALANCE",
      provider: "KITAGG",
      category: "Saldo",
      logo: toStringValue(siteSetting.siteLogoUrl || siteSetting.siteFaviconUrl),
    },
    variantSnapshot: {
      name: `Saldo ${amount.toLocaleString("id-ID")}`,
      providerCode: "KITAGG_BALANCE_TOPUP",
      logo: toStringValue(siteSetting.siteLogoUrl || siteSetting.siteFaviconUrl),
      currency: "IDR",
      basePrice: 0,
      sellPrice: amount,
    },
    customerInputs: [],
    customerDisplay:
      toStringValue(customer?.name) || toStringValue(customer?.username) || "-",
    contactDetail: {
      email: toStringValue(customer?.email).toLowerCase(),
      phoneCountryCode: toStringValue(customer?.phoneCountryCode) || "+62",
      phoneNumber: toStringValue(customer?.phoneNumber).replace(/[^0-9]/g, ""),
    },
    customerAccountSnapshot: {
      customerId: customer._id,
      username: toStringValue(customer?.username).toLowerCase(),
      name: toStringValue(customer?.name),
      email: toStringValue(customer?.email).toLowerCase(),
      phoneCountryCode: toStringValue(customer?.phoneCountryCode) || "+62",
      phoneNumber: toStringValue(customer?.phoneNumber).replace(/[^0-9]/g, ""),
    },
    paymentMethodSnapshot: buildPaymentMethodSnapshot(paymentMethod),
    price: {
      currency: "IDR",
      buyPrice: 0,
      sellPrice: amount,
      profit: 0,
      promoDiscount: 0,
      subtotalAfterDiscount: amount,
      paymentFee: paymentFeeBreakdown.totalFee,
      paymentFeeFixed: paymentFeeBreakdown.fixedFee,
      paymentFeePercent: paymentFeeBreakdown.percentFee,
      totalAmount,
    },
    paymentMethodCode: normalizeCode(paymentMethod.code),
    paymentMethodName: toStringValue(paymentMethod.name),
    paymentStatus: "UNPAID",
    providerStatus: "PENDING",
    status: "UNPAID",
    region: "ID",
  };
}

async function attachTokopayPaymentToOrder(order, paymentMethod, siteSetting) {
  const tokopayConfig = getTokopayConfig();

  if (!tokopayConfig.enabled) {
    return {
      order,
      warning: "Tokopay belum dikonfigurasi di backend",
    };
  }

  const channelCode = normalizeCode(paymentMethod?.gatewayChannelCode || paymentMethod?.code);

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
    await order.save();

    logWarn({
      source: "backend",
      scope: "deployment",
      message: "Konfigurasi production payment belum siap untuk topup saldo",
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
      amount: Number(order.price?.totalAmount || 0),
      customerName: buildTokopayCustomerName(order.customerAccountSnapshot),
      customerEmail:
        toStringValue(order.customerAccountSnapshot?.email).toLowerCase() ||
        `topup-${String(order.invoiceNumber || "").toLowerCase()}@example.com`,
      customerPhone: buildTokopayCustomerPhone(order.customerAccountSnapshot),
      redirectUrl: invoiceUrl,
      expiredTs: Math.floor(expiresAt.getTime() / 1000),
      items: [
        {
          product_code: "KITAGG_BALANCE_TOPUP",
          name: `Top Up Saldo KITAGG ${Number(
            order.price?.sellPrice || 0
          ).toLocaleString("id-ID")}`,
          price: Number(order.price?.sellPrice || 0),
          product_url: invoiceUrl,
          image_url:
            toStringValue(order.variantSnapshot?.logo) ||
            toStringValue(order.gameSnapshot?.logo),
        },
      ],
    });

    const data = tokopayPayload?.data || {};

    order.paymentReferenceNumber =
      toStringValue(data.trx_id) || toStringValue(tokopayPayload?.reference);
    order.paymentGateway = {
      provider: "tokopay",
      channelCode: toStringValue(data.payment_channel) || channelCode,
      transactionId:
        toStringValue(data.trx_id) || toStringValue(tokopayPayload?.reference),
      reference: toStringValue(tokopayPayload?.reference),
      payUrl: toStringValue(data.pay_url),
      checkoutUrl: toStringValue(data.checkout_url),
      qrLink: toStringValue(data.qr_link),
      qrString: toStringValue(data.qr_string),
      virtualAccountNumber: toStringValue(data.nomor_va),
      instructionsHtml: toStringValue(data.panduan_pembayaran),
      rawStatus: "UNPAID",
      totalPaid: Number(data.total_bayar || order.price?.totalAmount || 0),
      netAmount: Number(data.total_diterima || 0),
      expiresAt,
      updatedAt: new Date(),
    };
    order.notes = "";
    await order.save();

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
    await order.save();

    logError({
      source: "backend",
      scope: "payment-gateway",
      message: "Gagal membuat transaksi topup saldo Tokopay",
      meta: {
        invoiceNumber: order.invoiceNumber,
        channelCode,
        amount: Number(order.price?.totalAmount || 0),
      },
      error,
    });

    return {
      order,
      warning: error.message,
    };
  }
}

function serializeBalanceTopupOrder(order) {
  return {
    invoiceNumber: order.invoiceNumber,
    totalAmount: Number(order.price?.totalAmount || 0),
    currency: toStringValue(order.price?.currency || "IDR") || "IDR",
    paymentStatus: toStringValue(order.paymentStatus),
    status: toStringValue(order.status),
    paymentMethodName: toStringValue(order.paymentMethodName),
  };
}

async function getCurrentCustomerBalanceTransactions(req, res) {
  try {
    const limit = Math.min(toPositiveInteger(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const items = await CustomerBalanceTransaction.find({ customer: req.customer._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      items: items.map(serializeCustomerBalanceTransaction),
      limit,
      balance: Number(req.customer.balance || 0),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil histori saldo",
      error: error.message,
    });
  }
}

async function createCustomerBalanceTopup(req, res) {
  try {
    const amount = Math.round(Number(req.body?.amount || 0));
    const paymentMethodCode = normalizeCode(req.body?.paymentMethodCode);

    if (!paymentMethodCode) {
      return res.status(400).json({
        message: "Metode pembayaran wajib dipilih",
      });
    }

    if (!Number.isFinite(amount) || amount < MIN_TOPUP_AMOUNT || amount > MAX_TOPUP_AMOUNT) {
      return res.status(400).json({
        message: `Nominal topup saldo harus antara Rp${MIN_TOPUP_AMOUNT.toLocaleString(
          "id-ID"
        )} dan Rp${MAX_TOPUP_AMOUNT.toLocaleString("id-ID")}`,
      });
    }

    const [paymentMethod, siteSetting] = await Promise.all([
      PaymentMethod.findOne({
        code: paymentMethodCode,
        isActive: true,
      }).populate("category", "name code order isActive"),
      SiteSetting.findOne().sort({ updatedAt: -1 }),
    ]);

    if (!paymentMethod) {
      return res.status(404).json({
        message: "Metode pembayaran tidak ditemukan atau tidak aktif",
      });
    }

    if (paymentMethod.category && paymentMethod.category.isActive === false) {
      return res.status(400).json({
        message: "Kategori metode pembayaran ini sedang tidak aktif",
      });
    }

    const order = await Order.create(
      buildWalletTopupOrderPayload({
        customer: req.customer,
        siteSetting: siteSetting || {
          siteName: "KITAGG",
          siteLogoUrl: "",
          siteFaviconUrl: "",
          siteDomain: "",
        },
        paymentMethod,
        amount,
      })
    );

    let warning = "";

    if (!isManualPaymentMethod(paymentMethod)) {
      const result = await attachTokopayPaymentToOrder(order, paymentMethod, siteSetting || {});
      warning = result.warning || "";
    }

    return res.status(201).json({
      message: "Invoice topup saldo berhasil dibuat",
      order: serializeBalanceTopupOrder(order),
      warning: warning || undefined,
    });
  } catch (error) {
    logError({
      source: "backend",
      scope: "customer-balance",
      message: "Gagal membuat invoice topup saldo",
      meta: {
        customerId: req.customer?._id,
      },
      error,
    });

    return res.status(500).json({
      message: "Gagal membuat invoice topup saldo",
      error: error.message,
    });
  }
}

async function adjustCustomerBalanceByAdmin(req, res) {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    const amount = Math.round(Number(req.body?.amount || 0));
    const type = normalizeCode(req.body?.type);
    const note = toStringValue(req.body?.note);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Nominal saldo harus lebih dari 0",
      });
    }

    let result;

    if (type === "DEBIT") {
      result = await debitCustomerBalance({
        customerId: customer._id,
        amount,
        source: "ADMIN_DEBIT",
        description: note || "Pengurangan saldo manual oleh admin",
        createdByAdmin: req.admin?._id || null,
      });
    } else {
      result = await creditCustomerBalance({
        customerId: customer._id,
        amount,
        source: "ADMIN_CREDIT",
        description: note || "Penambahan saldo manual oleh admin",
        createdByAdmin: req.admin?._id || null,
      });
    }

    return res.status(200).json({
      message:
        type === "DEBIT"
          ? "Saldo user berhasil dikurangi"
          : "Saldo user berhasil ditambahkan",
      customer: {
        id: String(result.customer._id),
        balance: Number(result.customer.balance || 0),
      },
      transaction: serializeCustomerBalanceTransaction(result.transaction),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal menyesuaikan saldo user",
      error: error.message,
    });
  }
}

async function getCustomerBalanceTransactionsByAdmin(req, res) {
  try {
    const limit = Math.min(toPositiveInteger(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const items = await CustomerBalanceTransaction.find({ customer: req.params.id })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      items: items.map(serializeCustomerBalanceTransaction),
      limit,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil histori saldo user",
      error: error.message,
    });
  }
}

module.exports = {
  adjustCustomerBalanceByAdmin,
  createCustomerBalanceTopup,
  getCurrentCustomerBalanceTransactions,
  getCustomerBalanceTransactionsByAdmin,
};
