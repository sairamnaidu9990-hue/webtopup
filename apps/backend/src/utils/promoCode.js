const Order = require("../models/Order");
const PromoCode = require("../models/PromoCode");

const PROMO_DISCOUNT_TYPES = ["fixed", "percent"];
const EXCLUDED_USAGE_STATUSES = ["FAILED", "EXPIRED", "REFUNDED"];

function normalizePromoCode(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeCategory(value) {
  return String(value || "").trim();
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNonNegativeNumber(value, fallback = 0) {
  return Math.max(toNumber(value, fallback), 0);
}

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

function normalizeDiscountType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PROMO_DISCOUNT_TYPES.includes(normalized) ? normalized : "fixed";
}

function normalizeApplicableCategories(items) {
  const source = Array.isArray(items) ? items : [];
  const deduped = [];

  for (const item of source) {
    const value = normalizeCategory(item);

    if (!value) {
      continue;
    }

    if (!deduped.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
      deduped.push(value);
    }
  }

  return deduped;
}

function getJakartaDayRange(referenceDate = new Date()) {
  const offsetMs = 7 * 60 * 60 * 1000;
  const shifted = new Date(referenceDate.getTime() + offsetMs);
  const startUtcMs =
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
      0,
      0,
      0,
      0
    ) - offsetMs;

  return {
    start: new Date(startUtcMs),
    end: new Date(startUtcMs + 24 * 60 * 60 * 1000),
  };
}

function isPromoCategoryAllowed(promoCode, category) {
  const normalizedCategory = normalizeCategory(category);
  const applicableCategories = normalizeApplicableCategories(
    promoCode?.applicableCategories
  );

  if (applicableCategories.length === 0) {
    return true;
  }

  if (!normalizedCategory) {
    return false;
  }

  return applicableCategories.some(
    (item) => item.toLowerCase() === normalizedCategory.toLowerCase()
  );
}

function calculatePromoDiscountAmount(subtotal, promoCode) {
  const normalizedSubtotal = toNonNegativeNumber(subtotal, 0);
  const discountType = normalizeDiscountType(promoCode?.discountType);
  const discountValue = toNonNegativeNumber(promoCode?.discountValue, 0);

  if (normalizedSubtotal <= 0 || discountValue <= 0) {
    return 0;
  }

  if (discountType === "percent") {
    return Math.min(
      normalizedSubtotal,
      Math.floor((normalizedSubtotal * discountValue) / 100)
    );
  }

  return Math.min(normalizedSubtotal, discountValue);
}

async function getPromoDailyUsageCount(promoCode) {
  if (!promoCode?._id) {
    return 0;
  }

  const { start, end } = getJakartaDayRange();

  return Order.countDocuments({
    "promoSnapshot.promoId": promoCode._id,
    createdAt: {
      $gte: start,
      $lt: end,
    },
    status: {
      $nin: EXCLUDED_USAGE_STATUSES,
    },
  });
}

async function validatePromoForOrder({
  code,
  category,
  subtotal,
  requireActive = true,
}) {
  const normalizedCode = normalizePromoCode(code);

  if (!normalizedCode) {
    return {
      ok: false,
      status: 400,
      message: "Kode promo wajib diisi",
    };
  }

  const promoCode = await PromoCode.findOne({ code: normalizedCode });

  if (!promoCode) {
    return {
      ok: false,
      status: 404,
      message: "Kode promo tidak ditemukan",
    };
  }

  if (requireActive && !promoCode.isActive) {
    return {
      ok: false,
      status: 400,
      message: "Kode promo sedang tidak aktif",
      promoCode,
    };
  }

  if (!isPromoCategoryAllowed(promoCode, category)) {
    return {
      ok: false,
      status: 400,
      message: "Kode promo tidak berlaku untuk kategori ini",
      promoCode,
    };
  }

  const normalizedSubtotal = toNonNegativeNumber(subtotal, 0);
  const minimumOrderAmount = toNonNegativeNumber(
    promoCode.minimumOrderAmount,
    0
  );

  if (normalizedSubtotal < minimumOrderAmount) {
    return {
      ok: false,
      status: 400,
      message: `Minimal pembelian untuk promo ini adalah ${minimumOrderAmount}`,
      promoCode,
    };
  }

  const dailyUsageCount = await getPromoDailyUsageCount(promoCode);
  const maxDailyUses = toPositiveInteger(promoCode.maxDailyUses, 0);

  if (maxDailyUses > 0 && dailyUsageCount >= maxDailyUses) {
    return {
      ok: false,
      status: 400,
      message: "Kuota promo hari ini sudah habis",
      promoCode,
      dailyUsageCount,
      remainingDailyUses: 0,
    };
  }

  const discountAmount = calculatePromoDiscountAmount(
    normalizedSubtotal,
    promoCode
  );

  if (discountAmount <= 0) {
    return {
      ok: false,
      status: 400,
      message: "Diskon promo tidak dapat diterapkan ke transaksi ini",
      promoCode,
      dailyUsageCount,
      remainingDailyUses:
        maxDailyUses > 0 ? Math.max(maxDailyUses - dailyUsageCount, 0) : null,
    };
  }

  return {
    ok: true,
    status: 200,
    promoCode,
    discountAmount,
    dailyUsageCount,
    remainingDailyUses:
      maxDailyUses > 0 ? Math.max(maxDailyUses - dailyUsageCount, 0) : null,
  };
}

function serializePromoCode(promoCode, options = {}) {
  const subtotal = toNonNegativeNumber(options.subtotal, 0);
  const category = normalizeCategory(options.category);
  const dailyUsageCount = toNonNegativeNumber(options.dailyUsageCount, 0);
  const maxDailyUses = toPositiveInteger(promoCode?.maxDailyUses, 0);
  const minimumOrderAmount = toNonNegativeNumber(
    promoCode?.minimumOrderAmount,
    0
  );
  const allowedForCategory = isPromoCategoryAllowed(promoCode, category);
  const reachedDailyLimit = maxDailyUses > 0 && dailyUsageCount >= maxDailyUses;
  const reachedMinimumOrder = subtotal >= minimumOrderAmount;
  const discountAmount = calculatePromoDiscountAmount(subtotal, promoCode);
  const isAvailable =
    Boolean(promoCode?.isActive) &&
    allowedForCategory &&
    reachedMinimumOrder &&
    !reachedDailyLimit &&
    (subtotal <= 0 || discountAmount > 0);

  return {
    _id: String(promoCode?._id || ""),
    title: String(promoCode?.title || "").trim(),
    code: normalizePromoCode(promoCode?.code),
    description: String(promoCode?.description || "").trim(),
    discountType: normalizeDiscountType(promoCode?.discountType),
    discountValue: toNonNegativeNumber(promoCode?.discountValue, 0),
    minimumOrderAmount,
    maxDailyUses,
    applicableCategories: normalizeApplicableCategories(
      promoCode?.applicableCategories
    ),
    isActive: Boolean(promoCode?.isActive),
    order: toNumber(promoCode?.order, 9999),
    dailyUsageCount,
    remainingDailyUses:
      maxDailyUses > 0 ? Math.max(maxDailyUses - dailyUsageCount, 0) : null,
    discountAmount,
    isAvailable,
    availabilityReason: !promoCode?.isActive
      ? "Promo sedang tidak aktif"
      : !allowedForCategory
      ? "Promo tidak berlaku untuk kategori ini"
      : !reachedMinimumOrder
      ? "Minimal pembelian belum tercapai"
      : reachedDailyLimit
      ? "Kuota promo hari ini habis"
      : "",
    createdAt: promoCode?.createdAt || null,
    updatedAt: promoCode?.updatedAt || null,
  };
}

module.exports = {
  calculatePromoDiscountAmount,
  escapeRegex,
  getPromoDailyUsageCount,
  isPromoCategoryAllowed,
  normalizeApplicableCategories,
  normalizeDiscountType,
  normalizePromoCode,
  serializePromoCode,
  toNonNegativeNumber,
  toPositiveInteger,
  validatePromoForOrder,
};
