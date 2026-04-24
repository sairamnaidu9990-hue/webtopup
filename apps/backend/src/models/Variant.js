const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },

    name: String,
    providerCode: String,
    productCode: String,

    basePrice: Number,
    markup: { type: Number, default: 0 },
    price: Number,
    currency: String,
    duration: {
      type: Number,
      default: 0,
    },
    region: {
      type: String,
      default: "ID",
    },
    variantCategoryId: {
      type: String,
      default: "",
    },

    logo: String,

    isActive: {
      type: Boolean,
      default: true,
    },

    status: String,
    statusLockedByAdmin: {
      type: Boolean,
      default: false,
    },
    syncSource: {
      type: String,
      enum: ["manual", "bangjeff"],
      default: "manual",
    },
  },
  { timestamps: true }
);

variantSchema.index({ game: 1, status: 1, price: 1, name: 1 });
variantSchema.index({ game: 1, variantCategoryId: 1, status: 1, price: 1 });
variantSchema.index({ productCode: 1, status: 1 });
variantSchema.index({ syncSource: 1, status: 1 });

module.exports = mongoose.model("Variant", variantSchema);
