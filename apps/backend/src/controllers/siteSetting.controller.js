const SiteSetting = require("../models/SiteSetting");

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
const MAX_FOOTER_SOCIAL_LINKS = 12;
const MAX_FOOTER_COLUMNS = 6;
const MAX_FOOTER_COLUMN_LINKS = 10;

const defaultSiteSetting = {
  siteName: "WebTopup",
  siteLogoUrl: "",
  siteFaviconUrl: "",
  siteDomain: "",
  siteTitle: "WebTopup - Top Up Game Realtime",
  siteDescription:
    "Website top up game realtime dengan katalog yang dikelola langsung dari panel admin.",
  gameCategories: DEFAULT_GAME_CATEGORIES,
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
    { label: "Instagram", url: "" },
    { label: "Telegram", url: "" },
    { label: "Facebook", url: "" },
  ],
  footerLinkColumns: [
    {
      title: "Partnership",
      links: [
        { label: "Reseller", url: "" },
        { label: "Affiliate", url: "" },
      ],
    },
    {
      title: "Site Map",
      links: [
        { label: "Contact Us", url: "" },
        { label: "Terms & Conditions", url: "" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Telegram", url: "" },
        { label: "Line", url: "" },
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

function normalizeFooterLink(item) {
  return {
    label: String(item?.label || "").trim(),
    url: String(item?.url || "").trim(),
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

async function getOrCreateSiteSetting() {
  let siteSetting = await SiteSetting.findOne();

  if (!siteSetting) {
    siteSetting = await SiteSetting.create(defaultSiteSetting);
  }

  return siteSetting;
}

function serializeSiteSetting(siteSetting) {
  const bannerCount = normalizeBannerCount(
    siteSetting.bannerCount ?? defaultSiteSetting.bannerCount
  );
  const banners = syncBannerLength(siteSetting.banners || [], bannerCount);

  return {
    siteName: siteSetting.siteName || defaultSiteSetting.siteName,
    siteLogoUrl: siteSetting.siteLogoUrl || "",
    siteFaviconUrl: siteSetting.siteFaviconUrl || "",
    siteDomain: siteSetting.siteDomain || "",
    siteTitle: siteSetting.siteTitle || defaultSiteSetting.siteTitle,
    siteDescription:
      siteSetting.siteDescription || defaultSiteSetting.siteDescription,
    gameCategories: normalizeGameCategories(
      siteSetting.gameCategories,
      defaultSiteSetting.gameCategories
    ),
    bannerCount,
    bannerAutoSlideSeconds: normalizeBannerAutoSlideSeconds(
      siteSetting.bannerAutoSlideSeconds ??
        defaultSiteSetting.bannerAutoSlideSeconds
    ),
    homepagePopupEnabled: normalizeBoolean(
      siteSetting.homepagePopupEnabled,
      defaultSiteSetting.homepagePopupEnabled
    ),
    homepagePopupTitle: normalizeHomepagePopupTitle(
      siteSetting.homepagePopupTitle
    ),
    homepagePopupMessage: normalizeHomepagePopupMessage(
      siteSetting.homepagePopupMessage
    ),
    homepagePopupImageUrl: normalizeHomepagePopupImageUrl(
      siteSetting.homepagePopupImageUrl
    ),
    floatingContactEnabled: normalizeBoolean(
      siteSetting.floatingContactEnabled,
      defaultSiteSetting.floatingContactEnabled
    ),
    floatingContactLabel: normalizeFloatingContactLabel(
      siteSetting.floatingContactLabel
    ),
    floatingContactUrl: normalizeFloatingContactUrl(
      siteSetting.floatingContactUrl
    ),
    maintenanceModeEnabled: normalizeBoolean(
      siteSetting.maintenanceModeEnabled,
      defaultSiteSetting.maintenanceModeEnabled
    ),
    maintenanceTitle: normalizeMaintenanceTitle(
      siteSetting.maintenanceTitle
    ),
    maintenanceMessage: normalizeMaintenanceMessage(
      siteSetting.maintenanceMessage
    ),
    banners,
    footerDescription:
      siteSetting.footerDescription ?? defaultSiteSetting.footerDescription,
    footerBottomText:
      siteSetting.footerBottomText ?? defaultSiteSetting.footerBottomText,
    footerSocialLinks: normalizeFooterSocialLinks(
      siteSetting.footerSocialLinks,
      defaultSiteSetting.footerSocialLinks
    ),
    footerLinkColumns: normalizeFooterLinkColumns(
      siteSetting.footerLinkColumns,
      defaultSiteSetting.footerLinkColumns
    ),
    updatedAt: siteSetting.updatedAt || null,
  };
}

exports.getPublicSiteSetting = async (req, res) => {
  try {
    const siteSetting = await getOrCreateSiteSetting();

    return res.status(200).json({
      siteSetting: serializeSiteSetting(siteSetting),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil pengaturan website",
      error: error.message,
    });
  }
};

exports.getAdminSiteSetting = async (req, res) => {
  try {
    const siteSetting = await getOrCreateSiteSetting();

    return res.status(200).json({
      siteSetting: serializeSiteSetting(siteSetting),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil pengaturan website",
      error: error.message,
    });
  }
};

exports.updateSiteSetting = async (req, res) => {
  try {
    const siteSetting = await getOrCreateSiteSetting();
    const nextBannerCount =
      req.body.bannerCount != null
        ? normalizeBannerCount(req.body.bannerCount)
        : normalizeBannerCount(siteSetting.bannerCount);

    if (req.body.siteName != null) {
      siteSetting.siteName = String(req.body.siteName).trim();
    }

    if (req.body.siteLogoUrl != null) {
      siteSetting.siteLogoUrl = String(req.body.siteLogoUrl).trim();
    }

    if (req.body.siteFaviconUrl != null) {
      siteSetting.siteFaviconUrl = String(req.body.siteFaviconUrl).trim();
    }

    if (req.body.siteDomain != null) {
      siteSetting.siteDomain = normalizeDomain(req.body.siteDomain);
    }

    if (req.body.siteTitle != null) {
      siteSetting.siteTitle = String(req.body.siteTitle).trim();
    }

    if (req.body.siteDescription != null) {
      siteSetting.siteDescription = String(req.body.siteDescription).trim();
    }

    if (Array.isArray(req.body.gameCategories)) {
      siteSetting.gameCategories = normalizeGameCategories(
        req.body.gameCategories
      );
    }

    if (req.body.bannerCount != null) {
      siteSetting.bannerCount = nextBannerCount;
    }

    if (req.body.bannerAutoSlideSeconds != null) {
      siteSetting.bannerAutoSlideSeconds = normalizeBannerAutoSlideSeconds(
        req.body.bannerAutoSlideSeconds
      );
    }

    if (req.body.homepagePopupEnabled != null) {
      siteSetting.homepagePopupEnabled = normalizeBoolean(
        req.body.homepagePopupEnabled,
        defaultSiteSetting.homepagePopupEnabled
      );
    }

    if (req.body.homepagePopupTitle != null) {
      siteSetting.homepagePopupTitle = normalizeHomepagePopupTitle(
        req.body.homepagePopupTitle
      );
    }

    if (req.body.homepagePopupMessage != null) {
      siteSetting.homepagePopupMessage = normalizeHomepagePopupMessage(
        req.body.homepagePopupMessage
      );
    }

    if (req.body.homepagePopupImageUrl != null) {
      siteSetting.homepagePopupImageUrl = normalizeHomepagePopupImageUrl(
        req.body.homepagePopupImageUrl
      );
    }

    if (req.body.floatingContactEnabled != null) {
      siteSetting.floatingContactEnabled = normalizeBoolean(
        req.body.floatingContactEnabled,
        defaultSiteSetting.floatingContactEnabled
      );
    }

    if (req.body.floatingContactLabel != null) {
      siteSetting.floatingContactLabel = normalizeFloatingContactLabel(
        req.body.floatingContactLabel
      );
    }

    if (req.body.floatingContactUrl != null) {
      siteSetting.floatingContactUrl = normalizeFloatingContactUrl(
        req.body.floatingContactUrl
      );
    }

    if (req.body.maintenanceModeEnabled != null) {
      siteSetting.maintenanceModeEnabled = normalizeBoolean(
        req.body.maintenanceModeEnabled,
        defaultSiteSetting.maintenanceModeEnabled
      );
    }

    if (req.body.maintenanceTitle != null) {
      siteSetting.maintenanceTitle = normalizeMaintenanceTitle(
        req.body.maintenanceTitle
      );
    }

    if (req.body.maintenanceMessage != null) {
      siteSetting.maintenanceMessage = normalizeMaintenanceMessage(
        req.body.maintenanceMessage
      );
    }

    if (Array.isArray(req.body.banners)) {
      siteSetting.banners = syncBannerLength(req.body.banners, nextBannerCount);
    } else if (req.body.bannerCount != null) {
      siteSetting.banners = syncBannerLength(siteSetting.banners || [], nextBannerCount);
    }

    if (req.body.footerDescription != null) {
      siteSetting.footerDescription = String(req.body.footerDescription).trim();
    }

    if (req.body.footerBottomText != null) {
      siteSetting.footerBottomText = String(req.body.footerBottomText).trim();
    }

    if (Array.isArray(req.body.footerSocialLinks)) {
      siteSetting.footerSocialLinks = normalizeFooterSocialLinks(
        req.body.footerSocialLinks
      );
    }

    if (Array.isArray(req.body.footerLinkColumns)) {
      siteSetting.footerLinkColumns = normalizeFooterLinkColumns(
        req.body.footerLinkColumns
      );
    }

    siteSetting.updatedBy = req.admin
      ? {
          adminId: req.admin._id,
          name: req.admin.name || "",
          email: req.admin.email || "",
        }
      : siteSetting.updatedBy;

    await siteSetting.save();

    return res.status(200).json({
      message: "Pengaturan website berhasil diperbarui",
      siteSetting: serializeSiteSetting(siteSetting),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memperbarui pengaturan website",
      error: error.message,
    });
  }
};
