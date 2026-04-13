const Order = require("../models/Order");

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
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
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
  getOrders,
};
