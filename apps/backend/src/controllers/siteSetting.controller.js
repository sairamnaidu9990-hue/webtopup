const SiteSetting = require("../models/SiteSetting");

const DEFAULT_BANNER_COUNT = 3;
const MAX_BANNER_COUNT = 10;
const DEFAULT_BANNER_SLIDE_SECONDS = 5;
const MIN_BANNER_SLIDE_SECONDS = 1;
const MAX_BANNER_SLIDE_SECONDS = 30;

const defaultSiteSetting = {
  siteName: "WebTopup",
  siteLogoUrl: "",
  siteFaviconUrl: "",
  siteDomain: "",
  siteTitle: "WebTopup - Top Up Game Realtime",
  siteDescription:
    "Website top up game realtime dengan katalog yang dikelola langsung dari panel admin.",
  bannerCount: DEFAULT_BANNER_COUNT,
  bannerAutoSlideSeconds: DEFAULT_BANNER_SLIDE_SECONDS,
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
    bannerCount,
    bannerAutoSlideSeconds: normalizeBannerAutoSlideSeconds(
      siteSetting.bannerAutoSlideSeconds ??
        defaultSiteSetting.bannerAutoSlideSeconds
    ),
    banners,
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

    if (req.body.bannerCount != null) {
      siteSetting.bannerCount = nextBannerCount;
    }

    if (req.body.bannerAutoSlideSeconds != null) {
      siteSetting.bannerAutoSlideSeconds = normalizeBannerAutoSlideSeconds(
        req.body.bannerAutoSlideSeconds
      );
    }

    if (Array.isArray(req.body.banners)) {
      siteSetting.banners = syncBannerLength(req.body.banners, nextBannerCount);
    } else if (req.body.bannerCount != null) {
      siteSetting.banners = syncBannerLength(siteSetting.banners || [], nextBannerCount);
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
