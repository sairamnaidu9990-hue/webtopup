const mongoose = require("mongoose");

const visitorEventSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      trim: true,
      index: true,
      maxlength: 80,
    },
    dayKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
      maxlength: 16,
    },
    path: {
      type: String,
      required: true,
      trim: true,
      index: true,
      maxlength: 300,
    },
    fullPath: {
      type: String,
      required: true,
      trim: true,
      maxlength: 600,
    },
    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },
    referrer: {
      type: String,
      default: "",
      trim: true,
      maxlength: 700,
    },
    referrerHost: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      maxlength: 180,
    },
    referrerSource: {
      type: String,
      default: "Direct",
      trim: true,
      maxlength: 180,
    },
    siteHost: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      maxlength: 180,
    },
    utmSource: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    utmMedium: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    utmCampaign: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
    },
    utmTerm: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
    },
    utmContent: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
    },
    deviceType: {
      type: String,
      default: "desktop",
      trim: true,
      lowercase: true,
      maxlength: 24,
    },
    userAgent: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    isBot: {
      type: Boolean,
      default: false,
      index: true,
    },
    occurredAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

visitorEventSchema.index({ dayKey: 1, occurredAt: -1 });
visitorEventSchema.index({ dayKey: 1, path: 1 });
visitorEventSchema.index({ dayKey: 1, referrerSource: 1 });

module.exports = mongoose.model("VisitorEvent", visitorEventSchema);
