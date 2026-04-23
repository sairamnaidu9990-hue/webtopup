const mongoose = require("mongoose");

const syncLogSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    scope: {
      type: String,
      default: "provider",
      trim: true,
    },
    status: {
      type: String,
      enum: ["PROCESSING", "SUCCESS", "FAILED"],
      required: true,
    },
    syncSource: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    region: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    productCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    errorMessage: {
      type: String,
      default: "",
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

module.exports = mongoose.model("SyncLog", syncLogSchema);
