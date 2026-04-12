const mongoose = require("mongoose");

const gameInputOptionSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const gameInputSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "text",
    },
    title: {
      type: String,
      default: "",
    },
    options: {
      type: [gameInputOptionSchema],
      default: [],
    },
    placeholder: {
      type: String,
      default: "",
    },
    minLength: {
      type: Number,
      default: 0,
    },
    maxLength: {
      type: Number,
      default: 0,
    },
    regexValidation: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

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
  inputs: {
    type: [gameInputSchema],
    default: [],
  },
}, { timestamps: true });

gameSchema.index({ status: 1, catalogOrder: 1, name: 1 });
gameSchema.index({ status: 1, isTrending: 1, trendingOrder: 1, name: 1 });
gameSchema.index({ code: 1 });

module.exports = mongoose.model("Game", gameSchema);
