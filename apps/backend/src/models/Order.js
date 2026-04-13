const mongoose = require("mongoose");

const customerInputSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "text",
    },
    value: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const priceSnapshotSchema = new mongoose.Schema(
  {
    currency: {
      type: String,
      default: "IDR",
    },
    buyPrice: {
      type: Number,
      default: 0,
    },
    sellPrice: {
      type: Number,
      default: 0,
    },
    profit: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const gameSnapshotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    code: {
      type: String,
      default: "",
    },
    provider: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    logo: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const variantSnapshotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    providerCode: {
      type: String,
      default: "",
    },
    logo: {
      type: String,
      default: "",
    },
    currency: {
      type: String,
      default: "IDR",
    },
    basePrice: {
      type: Number,
      default: 0,
    },
    sellPrice: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const ORDER_STATUSES = [
  "UNPAID",
  "PAID",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
  "EXPIRED",
];

const PAYMENT_STATUSES = [
  "UNPAID",
  "PAID",
  "FAILED",
  "EXPIRED",
  "REFUNDED",
];

const PROVIDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "UNKNOWN",
];

const orderSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      default: "bangjeff",
      index: true,
    },
    providerInvoiceNumber: {
      type: String,
      default: "",
      index: true,
    },
    providerReferenceNumber: {
      type: String,
      default: "",
      index: true,
    },
    paymentReferenceNumber: {
      type: String,
      default: "",
      index: true,
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      default: null,
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      default: null,
    },
    gameSnapshot: {
      type: gameSnapshotSchema,
      default: () => ({}),
    },
    variantSnapshot: {
      type: variantSnapshotSchema,
      default: () => ({}),
    },
    customerInputs: {
      type: [customerInputSchema],
      default: [],
    },
    customerDisplay: {
      type: String,
      default: "",
      index: true,
    },
    region: {
      type: String,
      default: "ID",
    },
    price: {
      type: priceSnapshotSchema,
      default: () => ({}),
    },
    paymentMethodCode: {
      type: String,
      default: "",
    },
    paymentMethodName: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "UNPAID",
      index: true,
    },
    providerStatus: {
      type: String,
      enum: PROVIDER_STATUSES,
      default: "PENDING",
      index: true,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "UNPAID",
      index: true,
    },
    providerMessage: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    processingAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    expiredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ providerStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ "gameSnapshot.code": 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
