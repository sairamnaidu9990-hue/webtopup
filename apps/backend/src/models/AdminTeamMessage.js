const mongoose = require("mongoose");

const adminSnapshotSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      default: "admin",
      trim: true,
    },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    kind: {
      type: String,
      enum: ["image", "file"],
      default: "file",
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    size: {
      type: Number,
      required: true,
      min: 1,
    },
    dataUrl: {
      type: String,
      required: true,
      maxlength: 8000000,
    },
  },
  { _id: false }
);

const seenBySchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      default: "admin",
      trim: true,
    },
    seenAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
);

const adminTeamMessageSchema = new mongoose.Schema(
  {
    roomKey: {
      type: String,
      default: "global",
      trim: true,
      lowercase: true,
      index: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: "",
    },
    sender: {
      type: adminSnapshotSchema,
      required: true,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length <= 4;
        },
        message: "Lampiran maksimal 4 file per pesan",
      },
    },
    seenBy: {
      type: [seenBySchema],
      default: [],
    },
  },
  { timestamps: true }
);

adminTeamMessageSchema.index({ roomKey: 1, createdAt: -1 });

module.exports = mongoose.model("AdminTeamMessage", adminTeamMessageSchema);
