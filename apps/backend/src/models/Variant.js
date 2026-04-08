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

    logo: String,

    isActive: {
      type: Boolean,
      default: true,
    },

    status: String,
    syncSource: {
      type: String,
      enum: ["manual", "bangjeff"],
      default: "manual",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Variant", variantSchema);
