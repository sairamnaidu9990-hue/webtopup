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

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 220,
      unique: true,
      index: true,
    },
    excerpt: {
      type: String,
      default: "",
      trim: true,
      maxlength: 360,
    },
    content: {
      type: String,
      required: true,
      maxlength: 50000,
    },
    coverImageUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1200,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED"],
      default: "DRAFT",
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 9999,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
      index: true,
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

articleSchema.index({
  status: 1,
  isFeatured: -1,
  sortOrder: 1,
  publishedAt: -1,
  createdAt: -1,
});

module.exports = mongoose.model("Article", articleSchema);
