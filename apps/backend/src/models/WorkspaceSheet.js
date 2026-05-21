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

const workspaceSheetColumnSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
  },
  { _id: false }
);

const workspaceSheetRowSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    cells: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { _id: false }
);

const workspaceSheetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: "",
      maxlength: 240,
    },
    columns: {
      type: [workspaceSheetColumnSchema],
      default: [],
    },
    rows: {
      type: [workspaceSheetRowSchema],
      default: [],
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

workspaceSheetSchema.index({ updatedAt: -1 });

module.exports = mongoose.model("WorkspaceSheet", workspaceSheetSchema);
