const mongoose = require("mongoose");

const providerBalanceLogSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    region: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
      index: true,
    },
    membership: {
      type: String,
      default: "",
      trim: true,
    },
    currency: {
      type: String,
      default: "IDR",
      trim: true,
      uppercase: true,
    },
    balanceValue: {
      type: Number,
      default: 0,
    },
    previousBalanceValue: {
      type: Number,
      default: 0,
    },
    deltaValue: {
      type: Number,
      default: 0,
    },
    changeType: {
      type: String,
      enum: ["UP", "DOWN", "SAME"],
      default: "SAME",
    },
    source: {
      type: String,
      default: "dashboard_auto",
      trim: true,
    },
    triggeredBy: {
      adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        default: null,
      },
      name: {
        type: String,
        default: "",
        trim: true,
      },
      email: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },
      role: {
        type: String,
        default: "",
        trim: true,
      },
    },
  },
  { timestamps: true }
);

providerBalanceLogSchema.index({ provider: 1, region: 1, createdAt: -1 });

module.exports = mongoose.model("ProviderBalanceLog", providerBalanceLogSchema);
