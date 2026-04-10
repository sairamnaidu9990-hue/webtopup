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

module.exports = mongoose.model("Game", gameSchema);
