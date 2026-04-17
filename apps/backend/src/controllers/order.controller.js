const Game = require("../models/Game");
const Order = require("../models/Order");
const PaymentMethod = require("../models/PaymentMethod");
const SiteSetting = require("../models/SiteSetting");
const Variant = require("../models/Variant");

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
const PROCESSING_SUMMARY_STATUSES = ["PAID", "PROCESSING"];

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
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

function serializePublicOrder(order) {
  return {
    _id: order._id,
    invoiceNumber: order.invoiceNumber,
    provider: order.provider,
    providerInvoiceNumber: order.providerInvoiceNumber,
    providerReferenceNumber: order.providerReferenceNumber,
    paymentReferenceNumber: order.paymentReferenceNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    providerStatus: order.providerStatus,
    customerInputs: Array.isArray(order.customerInputs) ? order.customerInputs : [],
    customerDisplay: order.customerDisplay,
    paymentMethodCode: order.paymentMethodCode,
    paymentMethodName: order.paymentMethodName,
    contactDetail: order.contactDetail,
    price: order.price,
    region: order.region,
    gameSnapshot: order.gameSnapshot,
    variantSnapshot: order.variantSnapshot,
    providerMessage: order.providerMessage,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
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
  const [totalOrders, successOrders, failedOrders, processingOrders] =
    await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "SUCCESS" }),
      Order.countDocuments({ status: "FAILED" }),
      Order.countDocuments({ status: { $in: PROCESSING_SUMMARY_STATUSES } }),
    ]);

  return {
    totalOrders,
    successOrders,
    failedOrders,
    processingOrders,
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

    return res.status(200).json({
      order: serializePublicOrder(order),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error ambil invoice order",
      error: error.message,
    });
  }
}

async function createOrderDraft(req, res) {
  try {
    const {
      gameCode,
      variantId,
      paymentMethodCode,
      customerInputs = [],
      contactDetail = {},
    } = req.body || {};

    const normalizedGameCode = normalizeCode(gameCode);
    const normalizedVariantId = toStringValue(variantId);
    const normalizedPaymentMethodCode = normalizeCode(paymentMethodCode);
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

    const [game, variant, paymentMethod] = await Promise.all([
      Game.findOne({ code: normalizedGameCode, status: "ACTIVE" }),
      Variant.findOne({
        _id: normalizedVariantId,
        status: "ACTIVE",
        isActive: true,
      }).populate("game", "code"),
      PaymentMethod.findOne({
        code: normalizedPaymentMethodCode,
        isActive: true,
      }).populate("category", "name code isActive order"),
    ]);

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
    const sellPrice = Number(variant.price || 0);
    const buyPrice = Number(variant.basePrice || 0);
    const paymentFee =
      paymentMethod.feeType === "percent"
        ? Math.ceil((sellPrice * Number(paymentMethod.feeValue || 0)) / 100)
        : Number(paymentMethod.feeValue || 0);
    const totalAmount = sellPrice + paymentFee;
    const profit = sellPrice - buyPrice;

    const order = await Order.create({
      invoiceNumber,
      provider: toStringValue(game.syncSource) || "bangjeff",
      game: game._id,
      variant: variant._id,
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
        basePrice: buyPrice,
        sellPrice,
      },
      customerInputs: normalizedInputs,
      customerDisplay: buildCustomerDisplay(normalizedInputs),
      contactDetail: {
        email: normalizedEmail,
        phoneCountryCode: normalizedPhoneCountryCode,
        phoneNumber: normalizedPhoneNumber,
      },
      region: toStringValue(variant.region) || "ID",
      price: {
        currency: toStringValue(variant.currency) || "IDR",
        buyPrice,
        sellPrice,
        profit,
        paymentFee,
        totalAmount,
      },
      paymentMethodCode: paymentMethod.code,
      paymentMethodName: paymentMethod.name,
      paymentStatus: "UNPAID",
      providerStatus: "PENDING",
      status: "UNPAID",
    });

    return res.status(201).json({
      message: "Order draft berhasil dibuat",
      order: serializePublicOrder(order),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error membuat order draft",
      error: error.message,
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
        { paymentMethodName: regex },
      ];
    }

    if (ORDER_STATUSES.includes(status)) {
      filter.status = status;
    }

    if (PAYMENT_STATUSES.includes(paymentStatus)) {
      filter.paymentStatus = paymentStatus;
    }

    const [items, totalItems, summary] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
      buildSummary(),
    ]);

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
    return res.status(500).json({
      message: "Error ambil data order",
      error: error.message,
    });
  }
}

module.exports = {
  createOrderDraft,
  getOrders,
  getPublicOrderByInvoice,
};
