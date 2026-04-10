import { cache } from "react";

const API_BASE =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

export type PublicSiteSetting = {
  siteName: string;
  siteLogoUrl: string;
  siteFaviconUrl: string;
  siteDomain: string;
  siteTitle: string;
  siteDescription: string;
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
};

export const getPublicSiteSetting = cache(async (): Promise<PublicSiteSetting> => {
  try {
    const response = await fetch(`${API_BASE}/api/site-settings/public`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch site setting");
    }

    const payload = await response.json();
    return payload.siteSetting || defaultSiteSetting;
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
