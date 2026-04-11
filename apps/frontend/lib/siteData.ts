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
  bannerUrl?: string;
  category?: string;
  provider?: string;
  syncSource?: string;
  isTrending?: boolean;
  trendingOrder?: number;
  catalogOrder?: number;
};

export type StorefrontGameInputOption = {
  value: string;
  title: string;
};

export type StorefrontGameInput = {
  name: string;
  type: string;
  title: string;
  options: StorefrontGameInputOption[];
};

export type StorefrontVariant = {
  _id: string;
  name: string;
  providerCode: string;
  productCode: string;
  basePrice: number;
  markup: number;
  price: number;
  currency: string;
  duration: number;
  region: string;
  logo?: string;
  status?: string;
  syncSource?: string;
};

export type StorefrontGameDetail = {
  game: StorefrontGame & {
    inputs: StorefrontGameInput[];
  };
  variants: StorefrontVariant[];
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

function normalizeStorefrontGame(
  game?: Partial<StorefrontGame> | null
): StorefrontGame {
  return {
    _id: String(game?._id || ""),
    name: String(game?.name || "").trim(),
    code: String(game?.code || "").trim().toUpperCase(),
    logo: String(game?.logo || "").trim(),
    bannerUrl: String(game?.bannerUrl || "").trim(),
    category: String(game?.category || "Topup Game").trim(),
    provider: String(game?.provider || "").trim(),
    syncSource: String(game?.syncSource || "").trim(),
    isTrending: Boolean(game?.isTrending),
    trendingOrder: Number(game?.trendingOrder || 0),
    catalogOrder: Number(game?.catalogOrder || 0),
  };
}

function normalizeStorefrontGameInput(
  input?: Partial<StorefrontGameInput> | null
): StorefrontGameInput {
  return {
    name: String(input?.name || "").trim(),
    type: String(input?.type || "").trim(),
    title: String(input?.title || "").trim(),
    options: Array.isArray(input?.options)
      ? input.options.map((option) => ({
          value: String(option?.value || "").trim(),
          title: String(option?.title || "").trim(),
        }))
      : [],
  };
}

function normalizeStorefrontVariant(
  variant?: Partial<StorefrontVariant> | null
): StorefrontVariant {
  return {
    _id: String(variant?._id || ""),
    name: String(variant?.name || "").trim(),
    providerCode: String(variant?.providerCode || "").trim(),
    productCode: String(variant?.productCode || "").trim(),
    basePrice: Number(variant?.basePrice || 0),
    markup: Number(variant?.markup || 0),
    price: Number(variant?.price || 0),
    currency: String(variant?.currency || "").trim(),
    duration: Number(variant?.duration || 0),
    region: String(variant?.region || "").trim(),
    logo: String(variant?.logo || "").trim(),
    status: String(variant?.status || "").trim(),
    syncSource: String(variant?.syncSource || "").trim(),
  };
}

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
          ? payload.trendingGames.map((game: StorefrontGame) =>
              normalizeStorefrontGame(game)
            )
          : [],
        allGames: Array.isArray(payload.allGames)
          ? payload.allGames.map((game: StorefrontGame) =>
              normalizeStorefrontGame(game)
            )
          : [],
      };
    } catch {
      return {
        trendingGames: [],
        allGames: [],
      };
    }
  }
);

export const getStorefrontGameDetail = cache(
  async (code: string): Promise<StorefrontGameDetail | null> => {
    const normalizedCode = String(code || "").trim().toUpperCase();

    if (!normalizedCode) {
      return null;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/games/storefront/${encodeURIComponent(normalizedCode)}`,
        {
          next: {
            revalidate: 60,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch storefront game detail");
      }

      const payload = await response.json();

      return {
        game: {
          ...normalizeStorefrontGame(payload.game),
          inputs: Array.isArray(payload.game?.inputs)
            ? payload.game.inputs.map(
                (input: StorefrontGameInput) =>
                  normalizeStorefrontGameInput(input)
              )
            : [],
        },
        variants: Array.isArray(payload.variants)
          ? payload.variants.map((variant: StorefrontVariant) =>
              normalizeStorefrontVariant(variant)
            )
          : [],
      };
    } catch {
      return null;
    }
  }
);
