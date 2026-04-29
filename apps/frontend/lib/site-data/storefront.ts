import { cache } from "react";

import { buildFrontendApiUrl } from "@/lib/runtimeConfig";
import {
  normalizeStorefrontGame,
  normalizeStorefrontGameInput,
  normalizeStorefrontPaymentMethod,
  normalizeStorefrontVariant,
} from "@/lib/site-data/normalizers";
import type {
  StorefrontGame,
  StorefrontGameDetail,
  StorefrontGameInput,
  StorefrontPaymentMethod,
  StorefrontVariant,
} from "@/lib/site-data/types";

export const getStorefrontGames = cache(
  async (): Promise<{
    trendingGames: StorefrontGame[];
    allGames: StorefrontGame[];
  }> => {
    try {
      const response = await fetch(
        await buildFrontendApiUrl("/api/storefront/games"),
        {
          next: {
            revalidate: 60,
          },
        }
      );

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
        await buildFrontendApiUrl(
          `/api/storefront/games/${encodeURIComponent(normalizedCode)}`
        ),
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
            ? payload.game.inputs.map((input: StorefrontGameInput) =>
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

export const getPublicPaymentMethods = cache(
  async (): Promise<StorefrontPaymentMethod[]> => {
    try {
      const response = await fetch(
        await buildFrontendApiUrl("/api/payment-methods/public"),
        {
          next: {
            revalidate: 60,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch payment methods");
      }

      const payload = await response.json();

      return Array.isArray(payload.items)
        ? payload.items.map((paymentMethod: StorefrontPaymentMethod) =>
            normalizeStorefrontPaymentMethod(paymentMethod)
          )
        : [];
    } catch {
      return [];
    }
  }
);
