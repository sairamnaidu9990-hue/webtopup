const Customer = require("../models/Customer");
const PromoCode = require("../models/PromoCode");
const CustomerPointTransaction = require("../models/CustomerPointTransaction");
const { creditCustomerBalance } = require("./customerBalance");

const REFERRAL_NEW_USER_BONUS_AMOUNT = 2500;
const REFERRAL_REFERRER_BONUS_AMOUNT = 2500;
const LOYALTY_POINTS_PER_SPEND_AMOUNT = 1000;
const LOYALTY_REDEEM_VALUE_PER_POINT = 10;
const LOYALTY_MIN_REDEEM_POINTS = 100;
const LOYALTY_PROMO_PREFIX = "KITLP";
const MAX_PROMO_CODE_ATTEMPTS = 5;

function toStringValue(value) {
  return String(value || "").trim();
}

function toPositiveInteger(value, fallback = 0) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function normalizeCode(value) {
  return toStringValue(value).toUpperCase();
}

function normalizeReferralCode(value) {
  return normalizeCode(value).replace(/[^A-Z0-9]/g, "");
}

function buildReferralCodeBase(seed) {
  const normalizedSeed = normalizeReferralCode(seed);

  if (!normalizedSeed) {
    return "KITAGG";
  }

  return normalizedSeed.slice(0, 8);
}

function createRandomSuffix(length = 4) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let output = "";

  for (let index = 0; index < length; index += 1) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return output;
}

async function generateUniqueReferralCode(seed) {
  const base = buildReferralCodeBase(seed);

  for (let attempt = 0; attempt < MAX_PROMO_CODE_ATTEMPTS * 4; attempt += 1) {
    const code = `${base}${createRandomSuffix(4)}`.slice(0, 12);
    const duplicate = await Customer.findOne({ referralCode: code })
      .select("_id")
      .lean();

    if (!duplicate) {
      return code;
    }
  }

  return `${Date.now().toString(36)}${createRandomSuffix(4)}`.toUpperCase();
}

function calculateLoyaltyPointsEarned(amount) {
  const normalizedAmount = Number(amount || 0);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    return 0;
  }

  return Math.floor(normalizedAmount / LOYALTY_POINTS_PER_SPEND_AMOUNT);
}

function calculateLoyaltyRedeemAmount(points) {
  const normalizedPoints = toPositiveInteger(points, 0);
  return normalizedPoints * LOYALTY_REDEEM_VALUE_PER_POINT;
}

function serializeCustomerPointTransaction(transaction) {
  return {
    id: String(transaction?._id || ""),
    type: toStringValue(transaction?.type),
    source: toStringValue(transaction?.source),
    points: Number(transaction?.points || 0),
    pointsBefore: Number(transaction?.pointsBefore || 0),
    pointsAfter: Number(transaction?.pointsAfter || 0),
    description: toStringValue(transaction?.description),
    invoiceNumber: toStringValue(transaction?.invoiceNumber),
    orderId: transaction?.order ? String(transaction.order) : "",
    promoCodeId: transaction?.promoCode ? String(transaction.promoCode) : "",
    balanceTransactionId: transaction?.balanceTransaction
      ? String(transaction.balanceTransaction)
      : "",
    createdAt: transaction?.createdAt || null,
    updatedAt: transaction?.updatedAt || null,
  };
}

async function creditCustomerPoints({
  customerId,
  points,
  source = "MANUAL",
  description = "",
  orderId = null,
  invoiceNumber = "",
  promoCodeId = null,
  balanceTransactionId = null,
}) {
  const safePoints = toPositiveInteger(points, 0);

  if (safePoints <= 0) {
    throw new Error("Nominal poin tidak valid");
  }

  const customer = await Customer.findByIdAndUpdate(
    customerId,
    {
      $inc: {
        loyaltyPoints: safePoints,
        totalLoyaltyPointsEarned: safePoints,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!customer) {
    throw new Error("User tidak ditemukan");
  }

  const pointsAfter = Number(customer.loyaltyPoints || 0);
  const pointsBefore = pointsAfter - safePoints;

  const transaction = await CustomerPointTransaction.create({
    customer: customer._id,
    type: "CREDIT",
    source,
    points: safePoints,
    pointsBefore,
    pointsAfter,
    description: toStringValue(description),
    order: orderId,
    invoiceNumber: toStringValue(invoiceNumber),
    promoCode: promoCodeId,
    balanceTransaction: balanceTransactionId,
  });

  return {
    customer,
    transaction,
  };
}

async function debitCustomerPoints({
  customerId,
  points,
  source = "MANUAL",
  description = "",
  orderId = null,
  invoiceNumber = "",
  promoCodeId = null,
  balanceTransactionId = null,
}) {
  const safePoints = toPositiveInteger(points, 0);

  if (safePoints <= 0) {
    throw new Error("Nominal poin tidak valid");
  }

  const customer = await Customer.findOneAndUpdate(
    {
      _id: customerId,
      loyaltyPoints: {
        $gte: safePoints,
      },
    },
    {
      $inc: {
        loyaltyPoints: -safePoints,
        totalLoyaltyPointsRedeemed: safePoints,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!customer) {
    throw new Error("Poin member tidak mencukupi");
  }

  const pointsAfter = Number(customer.loyaltyPoints || 0);
  const pointsBefore = pointsAfter + safePoints;

  const transaction = await CustomerPointTransaction.create({
    customer: customer._id,
    type: "DEBIT",
    source,
    points: safePoints,
    pointsBefore,
    pointsAfter,
    description: toStringValue(description),
    order: orderId,
    invoiceNumber: toStringValue(invoiceNumber),
    promoCode: promoCodeId,
    balanceTransaction: balanceTransactionId,
  });

  return {
    customer,
    transaction,
  };
}

function resolveOrderCustomerId(order) {
  return order?.customer || order?.customerAccountSnapshot?.customerId || null;
}

function isSuccessfulPurchaseOrder(order) {
  return (
    normalizeCode(order?.orderType || "PURCHASE") === "PURCHASE" &&
    normalizeCode(order?.status) === "SUCCESS"
  );
}

async function syncCustomerRewardsForSuccessfulOrder(order) {
  if (!isSuccessfulPurchaseOrder(order)) {
    return order;
  }

  const customerId = resolveOrderCustomerId(order);

  if (!customerId) {
    return order;
  }

  let shouldSaveOrder = false;

  if (!order.loyaltyPointsGrantedAt) {
    const pointsToGrant = calculateLoyaltyPointsEarned(
      Number(order?.price?.subtotalAfterDiscount || 0)
    );

    if (pointsToGrant > 0) {
      const loyaltyResult = await creditCustomerPoints({
        customerId,
        points: pointsToGrant,
        source: "ORDER_REWARD",
        description: `Poin member dari transaksi ${order.invoiceNumber}`,
        orderId: order._id,
        invoiceNumber: order.invoiceNumber,
      });

      order.loyaltyPointsGranted = pointsToGrant;
      order.loyaltyPointsGrantedAt = new Date();
      order.loyaltyPointsTransactionId = loyaltyResult.transaction?._id || null;
    } else {
      order.loyaltyPointsGranted = 0;
      order.loyaltyPointsGrantedAt = new Date();
    }

    shouldSaveOrder = true;
  }

  if (!order.referralRewardsProcessedAt) {
    const customer = await Customer.findById(customerId)
      .select("referredBy referralBonusGrantedAt")
      .lean();

    if (
      customer?.referredBy &&
      !customer.referralBonusGrantedAt &&
      (REFERRAL_NEW_USER_BONUS_AMOUNT > 0 || REFERRAL_REFERRER_BONUS_AMOUNT > 0)
    ) {
      const now = new Date();
      let welcomeTransaction = null;
      let referrerTransaction = null;

      if (REFERRAL_NEW_USER_BONUS_AMOUNT > 0) {
        welcomeTransaction = await creditCustomerBalance({
          customerId,
          amount: REFERRAL_NEW_USER_BONUS_AMOUNT,
          source: "REFERRAL_WELCOME_BONUS",
          description: `Bonus referral user baru dari transaksi ${order.invoiceNumber}`,
          orderId: order._id,
          invoiceNumber: order.invoiceNumber,
        });
      }

      if (REFERRAL_REFERRER_BONUS_AMOUNT > 0) {
        referrerTransaction = await creditCustomerBalance({
          customerId: customer.referredBy,
          amount: REFERRAL_REFERRER_BONUS_AMOUNT,
          source: "REFERRAL_REFERRER_BONUS",
          description: `Bonus referral dari transaksi ${order.invoiceNumber}`,
          orderId: order._id,
          invoiceNumber: order.invoiceNumber,
        });
      }

      await Customer.findByIdAndUpdate(customerId, {
        referralBonusGrantedAt: now,
        referralQualifiedOrder: order._id,
      });

      order.referralRewardsProcessedAt = now;
      order.referralWelcomeBonusAmount = REFERRAL_NEW_USER_BONUS_AMOUNT;
      order.referralReferrerBonusAmount = REFERRAL_REFERRER_BONUS_AMOUNT;
      order.referralWelcomeBalanceTransactionId =
        welcomeTransaction?.transaction?._id || null;
      order.referralReferrerBalanceTransactionId =
        referrerTransaction?.transaction?._id || null;
      shouldSaveOrder = true;
    }
  }

  if (shouldSaveOrder) {
    await order.save();
  }

  return order;
}

async function generateUniqueLoyaltyPromoCode(seed = LOYALTY_PROMO_PREFIX) {
  const normalizedSeed = buildReferralCodeBase(seed).slice(0, 6) || LOYALTY_PROMO_PREFIX;

  for (let attempt = 0; attempt < MAX_PROMO_CODE_ATTEMPTS; attempt += 1) {
    const code = `${normalizedSeed}${createRandomSuffix(6)}`;
    const duplicate = await PromoCode.findOne({ code }).select("_id").lean();

    if (!duplicate) {
      return code;
    }
  }

  return `${LOYALTY_PROMO_PREFIX}${Date.now().toString(36)}`.toUpperCase().slice(0, 14);
}

module.exports = {
  REFERRAL_NEW_USER_BONUS_AMOUNT,
  REFERRAL_REFERRER_BONUS_AMOUNT,
  LOYALTY_POINTS_PER_SPEND_AMOUNT,
  LOYALTY_REDEEM_VALUE_PER_POINT,
  LOYALTY_MIN_REDEEM_POINTS,
  calculateLoyaltyPointsEarned,
  calculateLoyaltyRedeemAmount,
  creditCustomerPoints,
  debitCustomerPoints,
  generateUniqueLoyaltyPromoCode,
  generateUniqueReferralCode,
  normalizeReferralCode,
  serializeCustomerPointTransaction,
  syncCustomerRewardsForSuccessfulOrder,
};
