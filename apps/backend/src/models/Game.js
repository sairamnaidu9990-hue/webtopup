const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  name: String,
  code: String,
  provider: {
    type: String,
    default: "",
  },
  logo: {
    type: String,
    default: "",
  },
  bannerUrl: {
    type: String,
    default: "",
  },
  category: {
    type: String,
    default: "Topup Game",
  },
  status: {
    type: String,
    default: "ACTIVE",
  },
  isTrending: {
    type: Boolean,
    default: false,
  },
  trendingOrder: {
    type: Number,
    default: 9999,
  },
  catalogOrder: {
    type: Number,
    default: 9999,
  },
  syncSource: {
    type: String,
    enum: ["manual", "bangjeff"],
    default: "manual",
  },
  inputs: [
    {
      name: String,
      type: String,
      title: String,
      options: Array,
    },
  ],
}, { timestamps: true });

gameSchema.index({ status: 1, catalogOrder: 1, name: 1 });
gameSchema.index({ status: 1, isTrending: 1, trendingOrder: 1, name: 1 });
gameSchema.index({ code: 1 });

module.exports = mongoose.model("Game", gameSchema);
