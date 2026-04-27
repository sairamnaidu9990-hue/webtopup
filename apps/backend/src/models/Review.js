const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      index: true,
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      default: null,
      index: true,
    },
    gameSnapshot: {
      name: {
        type: String,
        default: "",
      },
      code: {
        type: String,
        default: "",
        index: true,
      },
      provider: {
        type: String,
        default: "",
      },
      category: {
        type: String,
        default: "",
      },
      logo: {
        type: String,
        default: "",
      },
    },
    customerDisplay: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1200,
    },
    isCommentHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
    adminNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1200,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ "gameSnapshot.code": 1, createdAt: -1 });
reviewSchema.index({ rating: -1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
