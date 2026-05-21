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

const workspaceFileSchema = new mongoose.Schema(
  {
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
    kind: {
      type: String,
      enum: ["image", "file"],
      default: "file",
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
    uploadedBy: {
      type: adminSnapshotSchema,
      required: true,
    },
    updatedBy: {
      type: adminSnapshotSchema,
      required: true,
    },
  },
  { timestamps: true }
);

workspaceFileSchema.index({ createdAt: -1 });

module.exports = mongoose.model("WorkspaceFile", workspaceFileSchema);
