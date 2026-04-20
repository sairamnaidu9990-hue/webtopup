const mongoose = require("mongoose");

function getRetentionDays() {
  const parsed = Number.parseInt(
    String(process.env.APP_LOG_RETENTION_DAYS || "30"),
    10
  );

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 30;
  }

  return parsed;
}

function getExpiresAt() {
  return new Date(Date.now() + getRetentionDays() * 24 * 60 * 60 * 1000);
}

const appLogSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ["info", "warn", "error", "fatal"],
      required: true,
      index: true,
    },
    scope: {
      type: String,
      default: "application",
      trim: true,
      index: true,
    },
    source: {
      type: String,
      default: "backend",
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    requestId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    method: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    path: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    statusCode: {
      type: Number,
      default: null,
    },
    durationMs: {
      type: Number,
      default: null,
    },
    actor: {
      adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        default: null,
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
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    error: {
      name: {
        type: String,
        default: "",
        trim: true,
      },
      code: {
        type: String,
        default: "",
        trim: true,
      },
      stack: {
        type: String,
        default: "",
      },
    },
    expiresAt: {
      type: Date,
      default: getExpiresAt,
      index: {
        expireAfterSeconds: 0,
      },
    },
  },
  { timestamps: true }
);

appLogSchema.index({ createdAt: -1, level: 1 });

module.exports = mongoose.models.AppLog || mongoose.model("AppLog", appLogSchema);
