const DEFAULT_BANNER_COUNT = 3;
const MAX_BANNER_COUNT = 10;
const DEFAULT_BANNER_SLIDE_SECONDS = 5;
const MIN_BANNER_SLIDE_SECONDS = 1;
const MAX_BANNER_SLIDE_SECONDS = 30;
const DEFAULT_GAME_CATEGORIES = [
  "Topup Game",
  "Topup Pulsa",
  "Voucher",
  "Live Streaming",
];
const MAX_GAME_CATEGORIES = 12;
const MAX_GAME_FAQS = 20;
const MAX_FOOTER_SOCIAL_LINKS = 12;
const MAX_FOOTER_COLUMNS = 6;
const MAX_FOOTER_COLUMN_LINKS = 10;

const defaultSiteSetting = {
  siteName: "WebTopup",
  siteLogoUrl: "",
  siteFaviconUrl: "",
  kitaggBalanceLogoUrl: "",
  siteDomain: "",
  googleSiteVerification: "",
  siteTitle: "WebTopup - Top Up Game Realtime",
  siteDescription:
    "Website top up game realtime dengan katalog yang dikelola langsung dari panel admin.",
  gameCategories: DEFAULT_GAME_CATEGORIES,
  categoryDescriptions: DEFAULT_GAME_CATEGORIES.map((category) => ({
    category,
    description: "",
  })),
  gameFaqs: [],
  reviewCommentsVisible: true,
  bannerCount: DEFAULT_BANNER_COUNT,
  bannerAutoSlideSeconds: DEFAULT_BANNER_SLIDE_SECONDS,
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
  legalityContent: "",
  privacyPolicyContent: "",
  termsConditionsContent: "",
  banners: [
    {
      title: "",
      imageUrl: "",
    },
    {
      title: "",
      imageUrl: "",
    },
    {
      title: "",
      imageUrl: "",
    },
  ],
  footerDescription:
    "Top up game dan voucher digital dengan katalog yang dikelola langsung dari panel admin.",
  footerBottomText: "© 2026 WebTopup. All rights reserved.",
  footerSocialLinks: [
    { label: "Instagram", url: "", iconUrl: "" },
    { label: "Telegram", url: "", iconUrl: "" },
    { label: "Facebook", url: "", iconUrl: "" },
  ],
  footerLinkColumns: [
    {
      title: "Partnership",
      links: [
        { label: "Reseller", url: "", iconUrl: "" },
        { label: "Affiliate", url: "", iconUrl: "" },
      ],
    },
    {
      title: "Site Map",
      links: [
        { label: "Contact Us", url: "", iconUrl: "" },
        { label: "Terms & Conditions", url: "", iconUrl: "" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Telegram", url: "", iconUrl: "" },
        { label: "Line", url: "", iconUrl: "" },
      ],
    },
  ],
};

function clampNumber(value, min, max, fallback) {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.min(Math.max(parsedValue, min), max);
}

function normalizeBannerCount(value) {
  return clampNumber(value, 0, MAX_BANNER_COUNT, DEFAULT_BANNER_COUNT);
}

function normalizeBannerAutoSlideSeconds(value) {
  return clampNumber(
    value,
    MIN_BANNER_SLIDE_SECONDS,
    MAX_BANNER_SLIDE_SECONDS,
    DEFAULT_BANNER_SLIDE_SECONDS
  );
}

function normalizeBannerItem(item) {
  return {
    title: String(item?.title || "").trim(),
    imageUrl: String(item?.imageUrl || "").trim(),
  };
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(normalizedValue)) {
      return true;
    }

    if (["false", "0", "no", "off"].includes(normalizedValue)) {
      return false;
    }
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return fallback;
}

function normalizeFloatingContactLabel(value) {
  const label = String(value || "").trim();
  return label || defaultSiteSetting.floatingContactLabel;
}

function normalizeHomepagePopupTitle(value) {
  return String(value || "").trim();
}

function normalizeHomepagePopupMessage(value) {
  return String(value || "").trim();
}

function normalizeHomepagePopupImageUrl(value) {
  return String(value || "").trim();
}

function normalizeFloatingContactUrl(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return "";
  }

  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(rawValue)) {
    return rawValue;
  }

  try {
    return new URL(`https://${rawValue}`).toString();
  } catch {
    return rawValue;
  }
}

function normalizeMaintenanceTitle(value) {
  const title = String(value || "").trim();
  return title || defaultSiteSetting.maintenanceTitle;
}

function normalizeMaintenanceMessage(value) {
  const message = String(value || "").trim();
  return message || defaultSiteSetting.maintenanceMessage;
}

function normalizeStaticInfoContent(value) {
  return String(value || "").trim();
}

function normalizeGameCategories(items, fallback = DEFAULT_GAME_CATEGORIES) {
  const source = Array.isArray(items) ? items : fallback;
  const deduped = [];

  for (const item of source) {
    const value = String(item || "").trim();

    if (!value) {
      continue;
    }

    if (!deduped.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
      deduped.push(value);
    }

    if (deduped.length >= MAX_GAME_CATEGORIES) {
      break;
    }
  }

  return deduped.length > 0 ? deduped : [...DEFAULT_GAME_CATEGORIES];
}

function normalizeCategoryDescriptionItem(item) {
  return {
    category: String(item?.category || "").trim(),
    description: String(item?.description || "").trim(),
  };
}

function normalizeCategoryDescriptions(items, categories, fallback = []) {
  const normalizedCategories = normalizeGameCategories(categories);
  const source = Array.isArray(items) ? items : fallback;
  const descriptionMap = new Map();

  source.forEach((item) => {
    const normalizedItem = normalizeCategoryDescriptionItem(item);
    const normalizedKey = normalizedItem.category.toLowerCase();

    if (!normalizedKey || descriptionMap.has(normalizedKey)) {
      return;
    }

    descriptionMap.set(normalizedKey, normalizedItem.description);
  });

  return normalizedCategories.map((category) => ({
    category,
    description: descriptionMap.get(category.toLowerCase()) || "",
  }));
}

function normalizeGameFaqItem(item) {
  return {
    question: String(item?.question || "").trim(),
    answer: String(item?.answer || "").trim(),
  };
}

function normalizeGameFaqs(items, fallback = []) {
  const source = Array.isArray(items) ? items : fallback;

  return source
    .map(normalizeGameFaqItem)
    .filter((item) => item.question || item.answer)
    .slice(0, MAX_GAME_FAQS);
}

function normalizeFooterLink(item) {
  return {
    label: String(item?.label || "").trim(),
    url: String(item?.url || "").trim(),
    iconUrl: String(item?.iconUrl || "").trim(),
  };
}

function normalizeFooterSocialLinks(items, fallback = []) {
  const source = Array.isArray(items) ? items : fallback;

  return source
    .map(normalizeFooterLink)
    .filter((item) => item.label || item.url)
    .slice(0, MAX_FOOTER_SOCIAL_LINKS);
}

function normalizeFooterColumn(column) {
  return {
    title: String(column?.title || "").trim(),
    links: (Array.isArray(column?.links) ? column.links : [])
      .map(normalizeFooterLink)
      .filter((item) => item.label || item.url)
      .slice(0, MAX_FOOTER_COLUMN_LINKS),
  };
}

function normalizeFooterLinkColumns(columns, fallback = []) {
  const source = Array.isArray(columns) ? columns : fallback;

  return source
    .map(normalizeFooterColumn)
    .filter((column) => column.title || column.links.length > 0)
    .slice(0, MAX_FOOTER_COLUMNS);
}

function syncBannerLength(banners, bannerCount) {
  return Array.from({ length: bannerCount }, (_, index) =>
    normalizeBannerItem(banners?.[index])
  );
}

function normalizeDomain(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(rawValue)
    ? rawValue
    : `https://${rawValue}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return rawValue;
  }
}

function normalizeGoogleSiteVerification(value) {
  return String(value || "").trim();
}

module.exports = {
  defaultSiteSetting,
  normalizeBannerCount,
  normalizeBannerAutoSlideSeconds,
  normalizeBoolean,
  normalizeCategoryDescriptions,
  normalizeDomain,
  normalizeFloatingContactLabel,
  normalizeFloatingContactUrl,
  normalizeFooterLinkColumns,
  normalizeFooterSocialLinks,
  normalizeGameCategories,
  normalizeGameFaqs,
  normalizeGoogleSiteVerification,
  normalizeHomepagePopupImageUrl,
  normalizeHomepagePopupMessage,
  normalizeHomepagePopupTitle,
  normalizeMaintenanceMessage,
  normalizeMaintenanceTitle,
  normalizeStaticInfoContent,
  syncBannerLength,
};
