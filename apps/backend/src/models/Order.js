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
    paymentFee: {
      type: Number,
      default: 0,
    },
    paymentFeeFixed: {
      type: Number,
      default: 0,
    },
    paymentFeePercent: {
      type: Number,
      default: 0,
    },
    promoDiscount: {
      type: Number,
      default: 0,
    },
    subtotalAfterDiscount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
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

const contactDetailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      default: "",
    },
    phoneCountryCode: {
      type: String,
      default: "+62",
    },
    phoneNumber: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const promoSnapshotSchema = new mongoose.Schema(
  {
    promoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromoCode",
      default: null,
    },
    title: {
      type: String,
      default: "",
    },
    code: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    discountType: {
      type: String,
      default: "fixed",
    },
    discountValue: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
    },
    maxDailyUses: {
      type: Number,
      default: 0,
    },
    applicableGameIds: {
      type: [String],
      default: [],
    },
    applicableCategories: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const customerAccountSnapshotSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    username: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    phoneCountryCode: {
      type: String,
      default: "+62",
    },
    phoneNumber: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const paymentMethodSnapshotSchema = new mongoose.Schema(
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
      default: "manual",
    },
    type: {
      type: String,
      default: "bank_transfer",
    },
    categoryName: {
      type: String,
      default: "",
    },
    categoryCode: {
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
    feeType: {
      type: String,
      default: "fixed",
    },
    feeValue: {
      type: Number,
      default: 0,
    },
    feeFixed: {
      type: Number,
      default: 0,
    },
    feePercent: {
      type: Number,
      default: 0,
    },
    gatewayChannelCode: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    accountHolderName: {
      type: String,
      default: "",
    },
    accountNumber: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const paymentGatewaySchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: "",
    },
    channelCode: {
      type: String,
      default: "",
    },
    transactionId: {
      type: String,
      default: "",
    },
    reference: {
      type: String,
      default: "",
    },
    payUrl: {
      type: String,
      default: "",
    },
    checkoutUrl: {
      type: String,
      default: "",
    },
    qrLink: {
      type: String,
      default: "",
    },
    qrString: {
      type: String,
      default: "",
    },
    virtualAccountNumber: {
      type: String,
      default: "",
    },
    instructionsHtml: {
      type: String,
      default: "",
    },
    rawStatus: {
      type: String,
      default: "",
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: null,
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
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
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
    contactDetail: {
      type: contactDetailSchema,
      default: () => ({}),
    },
    customerAccountSnapshot: {
      type: customerAccountSnapshotSchema,
      default: () => ({}),
    },
    promoSnapshot: {
      type: promoSnapshotSchema,
      default: () => ({}),
    },
    paymentMethodSnapshot: {
      type: paymentMethodSnapshotSchema,
      default: () => ({}),
    },
    paymentGateway: {
      type: paymentGatewaySchema,
      default: () => ({}),
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
orderSchema.index({ "contactDetail.phoneNumber": 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
