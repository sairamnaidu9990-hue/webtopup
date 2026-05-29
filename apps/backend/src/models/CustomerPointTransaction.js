const mongoose = require("mongoose");

const customerPointTransactionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
      index: true,
    },
    source: {
      type: String,
      default: "MANUAL",
      index: true,
    },
    points: {
      type: Number,
      required: true,
      min: 1,
    },
    pointsBefore: {
      type: Number,
      default: 0,
      min: 0,
    },
    pointsAfter: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    invoiceNumber: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    promoCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromoCode",
      default: null,
    },
    balanceTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerBalanceTransaction",
      default: null,
    },
  },
  { timestamps: true }
);

customerPointTransactionSchema.index({ customer: 1, createdAt: -1 });
customerPointTransactionSchema.index({ source: 1, createdAt: -1 });

module.exports = mongoose.model(
  "CustomerPointTransaction",
  customerPointTransactionSchema
);
