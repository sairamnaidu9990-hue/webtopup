const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String, 
      required: true,
      unique: true,
    },
    provider: {
    type: String, 
      required: true,
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

module.exports = mongoose.model("Game", gameSchema);