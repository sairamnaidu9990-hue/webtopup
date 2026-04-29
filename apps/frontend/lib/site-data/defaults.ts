import type { PublicSiteSetting } from "@/lib/site-data/types";

export const defaultSiteSetting: PublicSiteSetting = {
  siteName: "WebTopup",
  siteLogoUrl: "",
  siteFaviconUrl: "",
  siteDomain: "",
  googleSiteVerification: "",
  siteTitle: "WebTopup - Top Up Game Realtime",
  siteDescription:
    "Website top up game realtime dengan katalog yang dikelola langsung dari panel admin.",
  gameCategories: ["Topup Game", "Topup Pulsa", "Voucher", "Live Streaming"],
  categoryDescriptions: [
    { category: "Topup Game", description: "" },
    { category: "Topup Pulsa", description: "" },
    { category: "Voucher", description: "" },
    { category: "Live Streaming", description: "" },
  ],
  gameFaqs: [],
  reviewCommentsVisible: true,
  bannerCount: 3,
  bannerAutoSlideSeconds: 5,
  homepagePopupEnabled: false,
  homepagePopupTitle: "",
  homepagePopupMessage: "",
  homepagePopupImageUrl: "",
  floatingContactEnabled: false,
  floatingContactLabel: "Chat CS",
  floatingContactUrl: "",
  maintenanceModeEnabled: false,
  maintenanceTitle: "Website Sedang Maintenance",
  maintenanceMessage:
    "Kami sedang melakukan peningkatan sistem agar layanan lebih stabil. Silakan kembali lagi dalam beberapa saat.",
  banners: [],
  footerDescription:
    "Top up game dan voucher digital dengan katalog yang dikelola langsung dari panel admin.",
  footerBottomText: "© 2026 WebTopup. All rights reserved.",
  footerSocialLinks: [],
  footerLinkColumns: [],
};
