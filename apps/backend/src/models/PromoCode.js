const mongoose = require("mongoose");

const PROMO_DISCOUNT_TYPES = ["fixed", "percent"];

const promoCodeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    discountType: {
      type: String,
      enum: PROMO_DISCOUNT_TYPES,
      default: "fixed",
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDailyUses: {
      type: Number,
      default: 0,
      min: 0,
    },
    applicableCategories: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 9999,
    },
  },
  { timestamps: true }
);

promoCodeSchema.index({ isActive: 1, order: 1, createdAt: -1 });
promoCodeSchema.index({ applicableCategories: 1, isActive: 1 });

module.exports = mongoose.model("PromoCode", promoCodeSchema);
