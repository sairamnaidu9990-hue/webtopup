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

const workspaceNoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    content: {
      type: String,
      default: "",
      maxlength: 50000,
    },
    color: {
      type: String,
      default: "slate",
      trim: true,
      lowercase: true,
      maxlength: 30,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    createdBy: {
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

workspaceNoteSchema.index({ isPinned: -1, updatedAt: -1 });

module.exports = mongoose.model("WorkspaceNote", workspaceNoteSchema);
