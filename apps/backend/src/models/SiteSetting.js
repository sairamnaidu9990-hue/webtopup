const mongoose = require("mongoose");

const siteSettingSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: "WebTopup",
      trim: true,
    },
    siteLogoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    siteFaviconUrl: {
      type: String,
      default: "",
      trim: true,
    },
    siteDomain: {
      type: String,
      default: "",
      trim: true,
    },
    siteTitle: {
      type: String,
      default: "WebTopup - Top Up Game Realtime",
      trim: true,
    },
    siteDescription: {
      type: String,
      default:
        "Website top up game realtime dengan katalog yang dikelola langsung dari panel admin.",
      trim: true,
    },
    updatedBy: {
      adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        default: null,
      },
      name: {
        type: String,
        default: "",
        trim: true,
      },
      email: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSetting", siteSettingSchema);
