const Customer = require("../models/Customer");
const PromoCode = require("../models/PromoCode");
const CustomerPointTransaction = require("../models/CustomerPointTransaction");
const {
  creditCustomerBalance,
  serializeCustomerBalanceTransaction,
} = require("../utils/customerBalance");
const {
  calculateLoyaltyRedeemAmount,
  debitCustomerPoints,
  generateUniqueLoyaltyPromoCode,
  getRewardProgramSettings,
  serializeCustomerPointTransaction,
} = require("../utils/customerRewards");

const MAX_HISTORY_LIMIT = 20;

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

async function getCurrentCustomerRewards(req, res) {
  try {
    const limit = Math.min(
      toPositiveInteger(req.query.limit, MAX_HISTORY_LIMIT),
      MAX_HISTORY_LIMIT
    );
    const [customer, pointTransactions, referredCustomersCount, rewardProgramSettings] =
      await Promise.all([
        Customer.findById(req.customer._id)
          .select(
            "referralCode referredBy referralBonusGrantedAt referralQualifiedOrder loyaltyPoints totalLoyaltyPointsEarned totalLoyaltyPointsRedeemed"
          )
          .populate("referredBy", "name username referralCode")
          .lean(),
        CustomerPointTransaction.find({ customer: req.customer._id })
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean(),
        Customer.countDocuments({ referredBy: req.customer._id }),
        getRewardProgramSettings(),
      ]);

    return res.status(200).json({
      summary: {
        referralCode: toStringValue(customer?.referralCode),
        referredCustomersCount,
        loyaltyPoints: Number(customer?.loyaltyPoints || 0),
        totalLoyaltyPointsEarned: Number(customer?.totalLoyaltyPointsEarned || 0),
        totalLoyaltyPointsRedeemed: Number(
          customer?.totalLoyaltyPointsRedeemed || 0
        ),
        referralBonusGrantedAt: customer?.referralBonusGrantedAt || null,
        referralQualifiedOrder: customer?.referralQualifiedOrder
          ? String(customer.referralQualifiedOrder)
          : "",
        referredBy: customer?.referredBy
          ? {
              id: String(customer.referredBy._id || ""),
              name: toStringValue(customer.referredBy.name),
              username: toStringValue(customer.referredBy.username),
              referralCode: toStringValue(customer.referredBy.referralCode),
            }
          : null,
        referralNewUserBonusAmount:
          rewardProgramSettings.referralNewUserBonusAmount,
        referralReferrerBonusAmount:
          rewardProgramSettings.referralReferrerBonusAmount,
        loyaltyPointsPerSpendAmount:
          rewardProgramSettings.loyaltyPointsPerSpendAmount,
        loyaltyRedeemValuePerPoint:
          rewardProgramSettings.loyaltyRedeemValuePerPoint,
        minimumRedeemPoints: rewardProgramSettings.loyaltyMinimumRedeemPoints,
      },
      pointTransactions: pointTransactions.map(serializeCustomerPointTransaction),
      limit,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil data referral dan loyalty",
      error: error.message,
    });
  }
}

async function redeemCustomerPointsToBalance(req, res) {
  try {
    const points = toPositiveInteger(req.body?.points, 0);
    const rewardProgramSettings = await getRewardProgramSettings();

    if (points < rewardProgramSettings.loyaltyMinimumRedeemPoints) {
      return res.status(400).json({
        message: `Minimal tukar poin ke saldo adalah ${rewardProgramSettings.loyaltyMinimumRedeemPoints} poin`,
      });
    }

    const amount = calculateLoyaltyRedeemAmount(points, rewardProgramSettings);
    const pointResult = await debitCustomerPoints({
      customerId: req.customer._id,
      points,
      source: "LOYALTY_REDEEM_BALANCE",
      description: `Tukar ${points} poin menjadi saldo KITAGG`,
    });
    const balanceResult = await creditCustomerBalance({
      customerId: req.customer._id,
      amount,
      source: "LOYALTY_REDEEM_BALANCE",
      description: `Konversi ${points} poin menjadi saldo KITAGG`,
    });

    return res.status(200).json({
      message: `Berhasil menukar ${points} poin menjadi saldo ${amount.toLocaleString(
        "id-ID"
      )}`,
      summary: {
        loyaltyPoints: Number(pointResult.customer.loyaltyPoints || 0),
        balance: Number(balanceResult.customer.balance || 0),
      },
      pointTransaction: serializeCustomerPointTransaction(pointResult.transaction),
      balanceTransaction: serializeCustomerBalanceTransaction(
        balanceResult.transaction
      ),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal menukar poin ke saldo KITAGG",
      error: error.message,
    });
  }
}

async function redeemCustomerPointsToPromo(req, res) {
  try {
    const points = toPositiveInteger(req.body?.points, 0);
    const rewardProgramSettings = await getRewardProgramSettings();

    if (points < rewardProgramSettings.loyaltyMinimumRedeemPoints) {
      return res.status(400).json({
        message: `Minimal tukar poin ke promo adalah ${rewardProgramSettings.loyaltyMinimumRedeemPoints} poin`,
      });
    }

    const discountAmount = calculateLoyaltyRedeemAmount(
      points,
      rewardProgramSettings
    );
    const code = await generateUniqueLoyaltyPromoCode(req.customer.username);
    const promoCode = await PromoCode.create({
      title: `Promo Loyalty ${req.customer.username}`,
      code,
      description: `Promo personal hasil tukar ${points} poin loyalty KITAGG`,
      discountType: "fixed",
      discountValue: discountAmount,
      minimumOrderAmount: discountAmount,
      maxDailyUses: 1,
      maxTotalUses: 1,
      applicableGameIds: [],
      applicableCategories: [],
      isActive: true,
      ownedByCustomer: req.customer._id,
      order: -1,
    });

    try {
      const pointResult = await debitCustomerPoints({
        customerId: req.customer._id,
        points,
        source: "LOYALTY_REDEEM_PROMO",
        description: `Tukar ${points} poin menjadi kode promo`,
        promoCodeId: promoCode._id,
      });

      return res.status(201).json({
        message: "Poin berhasil ditukar menjadi kode promo personal",
        summary: {
          loyaltyPoints: Number(pointResult.customer.loyaltyPoints || 0),
        },
        pointTransaction: serializeCustomerPointTransaction(pointResult.transaction),
        promoCode: {
          _id: String(promoCode._id),
          title: promoCode.title,
          code: promoCode.code,
          discountType: promoCode.discountType,
          discountValue: Number(promoCode.discountValue || 0),
          description: promoCode.description,
        },
      });
    } catch (error) {
      await PromoCode.findByIdAndDelete(promoCode._id).catch(() => null);
      throw error;
    }
  } catch (error) {
    return res.status(500).json({
      message: "Gagal menukar poin menjadi promo",
      error: error.message,
    });
  }
}

module.exports = {
  getCurrentCustomerRewards,
  redeemCustomerPointsToBalance,
  redeemCustomerPointsToPromo,
};
