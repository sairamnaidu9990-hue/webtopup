const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    provider: {
      type: String,
      default: "manual",
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentMethodCategory",
      default: null,
      index: true,
    },
    logo: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: ["bank_transfer", "ewallet", "qris", "retail", "virtual_account"],
      default: "bank_transfer",
    },
    feeType: {
      type: String,
      enum: ["fixed", "percent", "mixed"],
      default: "fixed",
    },
    feeValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    feeFixed: {
      type: Number,
      default: 0,
      min: 0,
    },
    feePercent: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "IDR",
      trim: true,
      uppercase: true,
    },
    gatewayChannelCode: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    accountHolderName: {
      type: String,
      default: "",
      trim: true,
    },
    accountNumber: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 9999,
      index: true,
    },
  },
  { timestamps: true }
);

paymentMethodSchema.index({ order: 1, name: 1 });
paymentMethodSchema.index({ isActive: 1, order: 1, name: 1 });
paymentMethodSchema.index({ category: 1, isActive: 1, order: 1 });

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
