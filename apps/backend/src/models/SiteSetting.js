const mongoose = require("mongoose");

const siteFooterLinkSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: "",
      trim: true,
    },
    url: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const siteFooterColumnSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },
    links: [siteFooterLinkSchema],
  },
  { _id: false }
);

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
    footerDescription: {
      type: String,
      default:
        "Top up game dan voucher digital dengan katalog yang dikelola langsung dari panel admin.",
      trim: true,
    },
    footerBottomText: {
      type: String,
      default: "© 2026 WebTopup. All rights reserved.",
      trim: true,
    },
    footerSocialLinks: [siteFooterLinkSchema],
    footerLinkColumns: [siteFooterColumnSchema],
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
