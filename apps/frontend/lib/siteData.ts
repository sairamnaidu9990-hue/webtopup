import { cache } from "react";

const API_BASE =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

export type SiteBanner = {
  title: string;
  imageUrl: string;
};

export type SiteFooterLink = {
  label: string;
  url: string;
};

export type SiteFooterColumn = {
  title: string;
  links: SiteFooterLink[];
};

export type PublicSiteSetting = {
  siteName: string;
  siteLogoUrl: string;
  siteFaviconUrl: string;
  siteDomain: string;
  siteTitle: string;
  siteDescription: string;
  bannerCount: number;
  bannerAutoSlideSeconds: number;
  banners: SiteBanner[];
  footerDescription: string;
  footerBottomText: string;
  footerSocialLinks: SiteFooterLink[];
  footerLinkColumns: SiteFooterColumn[];
  updatedAt?: string | null;
};

export type StorefrontGame = {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  provider?: string;
  syncSource?: string;
  isTrending?: boolean;
  trendingOrder?: number;
  catalogOrder?: number;
};

const defaultSiteSetting: PublicSiteSetting = {
  siteName: "WebTopup",
  siteLogoUrl: "",
  siteFaviconUrl: "",
  siteDomain: "",
  siteTitle: "WebTopup - Top Up Game Realtime",
  siteDescription:
    "Website top up game realtime dengan katalog yang dikelola langsung dari panel admin.",
  bannerCount: 3,
  bannerAutoSlideSeconds: 5,
  banners: [],
  footerDescription:
    "Top up game dan voucher digital dengan katalog yang dikelola langsung dari panel admin.",
  footerBottomText: "© 2026 WebTopup. All rights reserved.",
  footerSocialLinks: [],
  footerLinkColumns: [],
};

function syncBannerLength(
  banners: SiteBanner[],
  bannerCount: number
): SiteBanner[] {
  return Array.from({ length: bannerCount }, (_, index) => ({
    title: banners[index]?.title || "",
    imageUrl: banners[index]?.imageUrl || "",
  }));
}

function normalizeSiteSetting(
  siteSetting?: Partial<PublicSiteSetting> | null
): PublicSiteSetting {
  const bannerCount = Math.min(
    Math.max(Number(siteSetting?.bannerCount ?? defaultSiteSetting.bannerCount) || 0, 0),
    10
  );

  return {
    ...defaultSiteSetting,
    ...siteSetting,
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
    banners: syncBannerLength(
      Array.isArray(siteSetting?.banners) ? siteSetting.banners : [],
      bannerCount
    ),
    footerSocialLinks: Array.isArray(siteSetting?.footerSocialLinks)
      ? siteSetting.footerSocialLinks
          .map((item) => ({
            label: String(item?.label || "").trim(),
            url: String(item?.url || "").trim(),
          }))
          .filter((item) => item.label || item.url)
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
                  }))
                  .filter((item) => item.label || item.url)
              : [],
          }))
          .filter((column) => column.title || column.links.length > 0)
      : defaultSiteSetting.footerLinkColumns,
  };
}

export const getPublicSiteSetting = cache(async (): Promise<PublicSiteSetting> => {
  try {
    const response = await fetch(`${API_BASE}/api/site-settings/public`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch site setting");
    }

    const payload = await response.json();
    return normalizeSiteSetting(payload.siteSetting);
  } catch {
    return defaultSiteSetting;
  }
});

export const getStorefrontGames = cache(
  async (): Promise<{
    trendingGames: StorefrontGame[];
    allGames: StorefrontGame[];
  }> => {
    try {
      const response = await fetch(`${API_BASE}/api/games/storefront`, {
        next: {
          revalidate: 60,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch storefront games");
      }

      const payload = await response.json();

      return {
        trendingGames: Array.isArray(payload.trendingGames)
          ? payload.trendingGames
          : [],
        allGames: Array.isArray(payload.allGames) ? payload.allGames : [],
      };
    } catch {
      return {
        trendingGames: [],
        allGames: [],
      };
    }
  }
);
