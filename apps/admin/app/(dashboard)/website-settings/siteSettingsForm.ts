import type {
  SiteCategoryDescription,
  SiteFooterColumn,
  SiteFooterLink,
  SiteGameFaq,
  SiteSetting,
} from "@/app/types/SiteSetting";

export const DEFAULT_BANNER_COUNT = 3;
export const MAX_BANNER_COUNT = 10;
export const DEFAULT_AUTO_SLIDE_SECONDS = 5;
export const DEFAULT_GAME_CATEGORIES = [
  "Topup Game",
  "Topup Pulsa",
  "Voucher",
  "Live Streaming",
];
export const DEFAULT_FOOTER_SOCIAL_LINKS: SiteFooterLink[] = [
  { label: "Instagram", url: "" },
  { label: "Telegram", url: "" },
  { label: "Facebook", url: "" },
];
export const DEFAULT_FOOTER_COLUMNS: SiteFooterColumn[] = [
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
];
export const DEFAULT_CATEGORY_DESCRIPTIONS: SiteCategoryDescription[] =
  DEFAULT_GAME_CATEGORIES.map((category) => ({
    category,
    description: "",
  }));
export const DEFAULT_GAME_FAQS: SiteGameFaq[] = [];

export const defaultSiteSettingForm: SiteSetting = {
  siteName: "WebTopup",
  siteLogoUrl: "",
  siteFaviconUrl: "",
  siteDomain: "",
  googleSiteVerification: "",
  siteTitle: "WebTopup - Top Up Game Realtime",
  siteDescription:
    "Website top up game realtime dengan katalog yang dikelola langsung dari panel admin.",
  gameCategories: DEFAULT_GAME_CATEGORIES,
  categoryDescriptions: DEFAULT_CATEGORY_DESCRIPTIONS,
  gameFaqs: DEFAULT_GAME_FAQS,
  reviewCommentsVisible: true,
  bannerCount: DEFAULT_BANNER_COUNT,
  bannerAutoSlideSeconds: DEFAULT_AUTO_SLIDE_SECONDS,
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
  banners: Array.from({ length: DEFAULT_BANNER_COUNT }, () => ({
    title: "",
    imageUrl: "",
  })),
  footerDescription:
    "Top up game dan voucher digital dengan katalog yang dikelola langsung dari panel admin.",
  footerBottomText: "© 2026 WebTopup. All rights reserved.",
  footerSocialLinks: DEFAULT_FOOTER_SOCIAL_LINKS,
  footerLinkColumns: DEFAULT_FOOTER_COLUMNS,
};

export function clampNumber(
  value: number,
  min: number,
  max: number,
  fallback: number
) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, min), max);
}

export function syncBannerLength(
  banners: SiteSetting["banners"],
  bannerCount: number
): SiteSetting["banners"] {
  return Array.from({ length: bannerCount }, (_, index) => ({
    title: banners[index]?.title || "",
    imageUrl: banners[index]?.imageUrl || "",
  }));
}

function normalizeGameCategories(categories?: string[] | null): string[] {
  const nextCategories = Array.isArray(categories)
    ? categories.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  return nextCategories.length > 0
    ? nextCategories
    : defaultSiteSettingForm.gameCategories;
}

function syncCategoryDescriptions(
  categoryDescriptions: SiteSetting["categoryDescriptions"],
  categories: string[]
): SiteSetting["categoryDescriptions"] {
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

function normalizeGameFaqs(
  gameFaqs?: SiteSetting["gameFaqs"] | null
): SiteSetting["gameFaqs"] {
  return Array.isArray(gameFaqs)
    ? gameFaqs.map((item) => ({
        question: item?.question || "",
        answer: item?.answer || "",
      }))
    : defaultSiteSettingForm.gameFaqs;
}

function normalizeFooterSocialLinks(
  links: SiteSetting["footerSocialLinks"]
): SiteSetting["footerSocialLinks"] {
  return Array.isArray(links)
    ? links.map((item) => ({
        label: item?.label || "",
        url: item?.url || "",
      }))
    : [];
}

function normalizeFooterLinkColumns(
  columns: SiteSetting["footerLinkColumns"]
): SiteSetting["footerLinkColumns"] {
  return Array.isArray(columns)
    ? columns.map((column) => ({
        title: column?.title || "",
        links: Array.isArray(column?.links)
          ? column.links.map((item) => ({
              label: item?.label || "",
              url: item?.url || "",
            }))
          : [],
      }))
    : [];
}

export function normalizeSiteSetting(
  value?: Partial<SiteSetting> | null
): SiteSetting {
  const gameCategories = normalizeGameCategories(value?.gameCategories);
  const bannerCount = clampNumber(
    Number(value?.bannerCount ?? defaultSiteSettingForm.bannerCount),
    0,
    MAX_BANNER_COUNT,
    defaultSiteSettingForm.bannerCount
  );

  return {
    ...defaultSiteSettingForm,
    ...value,
    gameCategories,
    categoryDescriptions: syncCategoryDescriptions(
      value?.categoryDescriptions ?? defaultSiteSettingForm.categoryDescriptions,
      gameCategories
    ),
    gameFaqs: normalizeGameFaqs(value?.gameFaqs),
    reviewCommentsVisible: Boolean(value?.reviewCommentsVisible ?? true),
    bannerCount,
    bannerAutoSlideSeconds: clampNumber(
      Number(
        value?.bannerAutoSlideSeconds ??
          defaultSiteSettingForm.bannerAutoSlideSeconds
      ),
      1,
      30,
      defaultSiteSettingForm.bannerAutoSlideSeconds
    ),
    homepagePopupEnabled: Boolean(value?.homepagePopupEnabled),
    googleSiteVerification: String(value?.googleSiteVerification || "").trim(),
    homepagePopupTitle: String(value?.homepagePopupTitle || "").trim(),
    homepagePopupMessage: String(value?.homepagePopupMessage || "").trim(),
    homepagePopupImageUrl: String(value?.homepagePopupImageUrl || "").trim(),
    banners: syncBannerLength(
      Array.isArray(value?.banners)
        ? value.banners
        : defaultSiteSettingForm.banners,
      bannerCount
    ),
    footerSocialLinks: normalizeFooterSocialLinks(
      value?.footerSocialLinks ?? defaultSiteSettingForm.footerSocialLinks
    ),
    footerLinkColumns: normalizeFooterLinkColumns(
      value?.footerLinkColumns ?? defaultSiteSettingForm.footerLinkColumns
    ),
  };
}
