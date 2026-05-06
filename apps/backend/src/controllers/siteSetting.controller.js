const SiteSetting = require("../models/SiteSetting");
const {
  defaultSiteSetting,
  normalizeBannerAutoSlideSeconds,
  normalizeBannerCount,
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
} = require("../utils/siteSettingForm");

async function getOrCreateSiteSetting() {
  let siteSetting = await SiteSetting.findOne();

  if (!siteSetting) {
    siteSetting = await SiteSetting.create(defaultSiteSetting);
  }

  return siteSetting;
}

function serializeSiteSetting(siteSetting) {
  const gameCategories = normalizeGameCategories(
    siteSetting.gameCategories,
    defaultSiteSetting.gameCategories
  );
  const bannerCount = normalizeBannerCount(
    siteSetting.bannerCount ?? defaultSiteSetting.bannerCount
  );
  const banners = syncBannerLength(siteSetting.banners || [], bannerCount);

  return {
    siteName: siteSetting.siteName || defaultSiteSetting.siteName,
    siteLogoUrl: siteSetting.siteLogoUrl || "",
    siteFaviconUrl: siteSetting.siteFaviconUrl || "",
    kitaggBalanceLogoUrl: siteSetting.kitaggBalanceLogoUrl || "",
    siteDomain: siteSetting.siteDomain || "",
    googleSiteVerification: normalizeGoogleSiteVerification(
      siteSetting.googleSiteVerification
    ),
    siteTitle: siteSetting.siteTitle || defaultSiteSetting.siteTitle,
    siteDescription:
      siteSetting.siteDescription || defaultSiteSetting.siteDescription,
    gameCategories,
    categoryDescriptions: normalizeCategoryDescriptions(
      siteSetting.categoryDescriptions,
      gameCategories,
      defaultSiteSetting.categoryDescriptions
    ),
    gameFaqs: normalizeGameFaqs(siteSetting.gameFaqs, defaultSiteSetting.gameFaqs),
    reviewCommentsVisible: normalizeBoolean(
      siteSetting.reviewCommentsVisible,
      defaultSiteSetting.reviewCommentsVisible
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
    legalityContent: normalizeStaticInfoContent(siteSetting.legalityContent),
    privacyPolicyContent: normalizeStaticInfoContent(
      siteSetting.privacyPolicyContent
    ),
    termsConditionsContent: normalizeStaticInfoContent(
      siteSetting.termsConditionsContent
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
    const nextGameCategories =
      req.body.gameCategories != null
        ? normalizeGameCategories(req.body.gameCategories)
        : normalizeGameCategories(siteSetting.gameCategories);
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

    if (req.body.kitaggBalanceLogoUrl != null) {
      siteSetting.kitaggBalanceLogoUrl = String(
        req.body.kitaggBalanceLogoUrl
      ).trim();
    }

    if (req.body.siteDomain != null) {
      siteSetting.siteDomain = normalizeDomain(req.body.siteDomain);
    }

    if (req.body.googleSiteVerification != null) {
      siteSetting.googleSiteVerification = normalizeGoogleSiteVerification(
        req.body.googleSiteVerification
      );
    }

    if (req.body.siteTitle != null) {
      siteSetting.siteTitle = String(req.body.siteTitle).trim();
    }

    if (req.body.siteDescription != null) {
      siteSetting.siteDescription = String(req.body.siteDescription).trim();
    }

    if (Array.isArray(req.body.gameCategories)) {
      siteSetting.gameCategories = nextGameCategories;
    }

    if (Array.isArray(req.body.categoryDescriptions)) {
      siteSetting.categoryDescriptions = normalizeCategoryDescriptions(
        req.body.categoryDescriptions,
        nextGameCategories,
        siteSetting.categoryDescriptions
      );
    } else if (Array.isArray(req.body.gameCategories)) {
      siteSetting.categoryDescriptions = normalizeCategoryDescriptions(
        siteSetting.categoryDescriptions,
        nextGameCategories,
        siteSetting.categoryDescriptions
      );
    }

    if (Array.isArray(req.body.gameFaqs)) {
      siteSetting.gameFaqs = normalizeGameFaqs(
        req.body.gameFaqs,
        siteSetting.gameFaqs
      );
    }

    if (req.body.reviewCommentsVisible != null) {
      siteSetting.reviewCommentsVisible = normalizeBoolean(
        req.body.reviewCommentsVisible,
        defaultSiteSetting.reviewCommentsVisible
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

    if (req.body.legalityContent != null) {
      siteSetting.legalityContent = normalizeStaticInfoContent(
        req.body.legalityContent
      );
    }

    if (req.body.privacyPolicyContent != null) {
      siteSetting.privacyPolicyContent = normalizeStaticInfoContent(
        req.body.privacyPolicyContent
      );
    }

    if (req.body.termsConditionsContent != null) {
      siteSetting.termsConditionsContent = normalizeStaticInfoContent(
        req.body.termsConditionsContent
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
