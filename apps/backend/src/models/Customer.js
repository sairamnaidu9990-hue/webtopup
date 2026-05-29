const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phoneCountryCode: {
      type: String,
      default: "+62",
      trim: true,
    },
    phoneNumber: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    referralCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
      index: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },
    referralBonusGrantedAt: {
      type: Date,
      default: null,
    },
    referralQualifiedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLoyaltyPointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLoyaltyPointsRedeemed: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
