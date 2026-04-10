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
    bannerCount: {
      type: Number,
      default: 3,
      min: 0,
      max: 10,
    },
    bannerAutoSlideSeconds: {
      type: Number,
      default: 5,
      min: 1,
      max: 30,
    },
    banners: [
      new mongoose.Schema(
        {
          title: {
            type: String,
            default: "",
            trim: true,
          },
          imageUrl: {
            type: String,
            default: "",
            trim: true,
          },
        },
        { _id: false }
      ),
    ],
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
