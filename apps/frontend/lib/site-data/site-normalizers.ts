import { defaultSiteSetting } from "@/lib/site-data/defaults";
import type {
  PublicSiteSetting,
  SiteBanner,
  SiteCategoryDescription,
  SiteGameFaq,
} from "@/lib/site-data/types";

export function syncBannerLength(
  banners: SiteBanner[],
  bannerCount: number
): SiteBanner[] {
  return Array.from({ length: bannerCount }, (_, index) => ({
    title: banners[index]?.title || "",
    imageUrl: banners[index]?.imageUrl || "",
  }));
}

export function normalizeSiteCategories(categories?: string[] | null): string[] {
  const nextCategories = Array.isArray(categories)
    ? categories.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  return nextCategories.length > 0
    ? nextCategories
    : defaultSiteSetting.gameCategories;
}

export function syncCategoryDescriptions(
  categoryDescriptions: SiteCategoryDescription[] | undefined,
  categories: string[]
): SiteCategoryDescription[] {
  const descriptionMap = new Map(
    (Array.isArray(categoryDescriptions) ? categoryDescriptions : []).map(
      (item) => [
        String(item?.category || "")
          .trim()
          .toLowerCase(),
        String(item?.description || ""),
      ]
    )
  );

  return categories.map((category) => ({
    category,
    description: descriptionMap.get(category.toLowerCase()) || "",
  }));
}

export function normalizeGameFaqs(gameFaqs?: SiteGameFaq[] | null): SiteGameFaq[] {
  return Array.isArray(gameFaqs)
    ? gameFaqs.map((item) => ({
        question: String(item?.question || "").trim(),
        answer: String(item?.answer || "").trim(),
      }))
    : defaultSiteSetting.gameFaqs;
}

export function normalizeSiteSetting(
  siteSetting?: Partial<PublicSiteSetting> | null
): PublicSiteSetting {
  const gameCategories = normalizeSiteCategories(siteSetting?.gameCategories);
  const bannerCount = Math.min(
    Math.max(Number(siteSetting?.bannerCount ?? defaultSiteSetting.bannerCount) || 0, 0),
    10
  );

  return {
    ...defaultSiteSetting,
    ...siteSetting,
    kitaggBalanceLogoUrl: String(siteSetting?.kitaggBalanceLogoUrl || "").trim(),
    googleSiteVerification: String(
      siteSetting?.googleSiteVerification || ""
    ).trim(),
    gameCategories,
    categoryDescriptions: syncCategoryDescriptions(
      siteSetting?.categoryDescriptions,
      gameCategories
    ),
    gameFaqs: normalizeGameFaqs(siteSetting?.gameFaqs),
    reviewCommentsVisible: Boolean(siteSetting?.reviewCommentsVisible ?? true),
    bannerCount,
    bannerAutoSlideSeconds: Math.min(
      Math.max(
        Number(
          siteSetting?.bannerAutoSlideSeconds ??
            defaultSiteSetting.bannerAutoSlideSeconds
        ) || defaultSiteSetting.bannerAutoSlideSeconds,
        1
      ),
      30
    ),
    homepagePopupEnabled: Boolean(siteSetting?.homepagePopupEnabled),
    homepagePopupTitle: String(siteSetting?.homepagePopupTitle || "").trim(),
    homepagePopupMessage: String(siteSetting?.homepagePopupMessage || "").trim(),
    homepagePopupImageUrl: String(siteSetting?.homepagePopupImageUrl || "").trim(),
    floatingContactEnabled: Boolean(siteSetting?.floatingContactEnabled),
    floatingContactLabel:
      String(siteSetting?.floatingContactLabel || "").trim() ||
      defaultSiteSetting.floatingContactLabel,
    floatingContactUrl: String(siteSetting?.floatingContactUrl || "").trim(),
    maintenanceModeEnabled: Boolean(siteSetting?.maintenanceModeEnabled),
    maintenanceTitle:
      String(siteSetting?.maintenanceTitle || "").trim() ||
      defaultSiteSetting.maintenanceTitle,
    maintenanceMessage:
      String(siteSetting?.maintenanceMessage || "").trim() ||
      defaultSiteSetting.maintenanceMessage,
    legalityContent: String(siteSetting?.legalityContent || "").trim(),
    privacyPolicyContent: String(
      siteSetting?.privacyPolicyContent || ""
    ).trim(),
    termsConditionsContent: String(
      siteSetting?.termsConditionsContent || ""
    ).trim(),
    banners: syncBannerLength(
      Array.isArray(siteSetting?.banners) ? siteSetting.banners : [],
      bannerCount
    ),
    footerSocialLinks: Array.isArray(siteSetting?.footerSocialLinks)
      ? siteSetting.footerSocialLinks
          .map((item) => ({
            label: String(item?.label || "").trim(),
            url: String(item?.url || "").trim(),
            iconUrl: String(item?.iconUrl || "").trim(),
          }))
          .filter((item) => item.label || item.url || item.iconUrl)
      : defaultSiteSetting.footerSocialLinks,
    footerLinkColumns: Array.isArray(siteSetting?.footerLinkColumns)
      ? siteSetting.footerLinkColumns
          .map((column) => ({
            title: String(column?.title || "").trim(),
            links: Array.isArray(column?.links)
              ? column.links
                  .map((item) => ({
                    label: String(item?.label || "").trim(),
                    url: String(item?.url || "").trim(),
                    iconUrl: String(item?.iconUrl || "").trim(),
                  }))
                  .filter((item) => item.label || item.url || item.iconUrl)
              : [],
          }))
          .filter((column) => column.title || column.links.length > 0)
      : defaultSiteSetting.footerLinkColumns,
  };
}
