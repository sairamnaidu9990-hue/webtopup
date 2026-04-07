const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    basePrice: {
      type: Number,
      required: true,
    },

    // 📈 MARKUP (%)
    markup: {
      type: Number,
      default: 5, 
    },

  
    price: {
      type: Number,
      required: true,
    },

    provider: {
      type: String,
      default: "manual",
    },

    providerCode: {
      type: String, 
    },

    logo: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);