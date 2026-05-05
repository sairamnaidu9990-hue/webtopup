const mongoose = require("mongoose");
const {
  DEFAULT_PROVIDER_SYNC_TIMEZONE,
  buildDefaultBangjeffSyncActions,
} = require("../utils/providerSyncSettings");

const providerSyncActionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    time: {
      type: String,
      default: "00:00",
      trim: true,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    lastRunStatus: {
      type: String,
      enum: ["IDLE", "RUNNING", "SUCCESS", "FAILED"],
      default: "IDLE",
      uppercase: true,
      trim: true,
    },
    lastError: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const providerSyncSettingSchema = new mongoose.Schema(
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
      default: "ID",
      trim: true,
      uppercase: true,
    },
    timezone: {
      type: String,
      default: DEFAULT_PROVIDER_SYNC_TIMEZONE,
      trim: true,
    },
    actions: {
      type: [providerSyncActionSchema],
      default: buildDefaultBangjeffSyncActions,
    },
    updatedBy: {
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
    },
  },
  { timestamps: true }
);

providerSyncSettingSchema.index({ provider: 1, region: 1 }, { unique: true });

module.exports = mongoose.model("ProviderSyncSetting", providerSyncSettingSchema);
