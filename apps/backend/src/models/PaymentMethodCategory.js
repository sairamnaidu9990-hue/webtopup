const mongoose = require("mongoose");

const paymentMethodCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 9999,
      index: true,
    },
  },
  { timestamps: true }
);

paymentMethodCategorySchema.index({ order: 1, name: 1 });
paymentMethodCategorySchema.index({ isActive: 1, order: 1, name: 1 });

module.exports = mongoose.model(
  "PaymentMethodCategory",
  paymentMethodCategorySchema
);
