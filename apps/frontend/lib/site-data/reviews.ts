import { cache } from "react";

import { buildFrontendApiUrl } from "@/lib/runtimeConfig";
import {
  normalizeStorefrontGameReviewSummary,
  normalizeStorefrontReviewEntry,
} from "@/lib/site-data/normalizers";
import type {
  PublicReviewsPage,
  StorefrontGameReviewSummary,
  StorefrontReviewEntry,
} from "@/lib/site-data/types";

export const getStorefrontGameReviewSummary = cache(
  async (gameCode: string): Promise<StorefrontGameReviewSummary> => {
    const normalizedGameCode = String(gameCode || "").trim().toUpperCase();

    if (!normalizedGameCode) {
      return normalizeStorefrontGameReviewSummary();
    }

    try {
      const response = await fetch(
        await buildFrontendApiUrl(
          `/api/reviews/game/${encodeURIComponent(normalizedGameCode)}`
        ),
        {
          next: {
            revalidate: 30,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch game review summary");
      }

      const payload = await response.json();
      return normalizeStorefrontGameReviewSummary(payload?.summary);
    } catch {
      return normalizeStorefrontGameReviewSummary();
    }
  }
);

export const getPublicReviews = cache(
  async (
    gameCode = "",
    page = 1,
    limit = 12
  ): Promise<PublicReviewsPage> => {
    try {
      const params = new URLSearchParams({
        page: String(Math.max(1, Number(page) || 1)),
        limit: String(Math.min(Math.max(Number(limit) || 12, 1), 30)),
      });
      const normalizedGameCode = String(gameCode || "").trim().toUpperCase();

      if (normalizedGameCode) {
        params.set("gameCode", normalizedGameCode);
      }

      const response = await fetch(
        await buildFrontendApiUrl(`/api/reviews/public?${params.toString()}`),
        {
          next: {
            revalidate: 30,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch public reviews");
      }

      const payload = await response.json();

      return {
        items: Array.isArray(payload?.items)
          ? payload.items.map((item: StorefrontReviewEntry) =>
              normalizeStorefrontReviewEntry(item)
            )
          : [],
        page: Number(payload?.page || 1),
        limit: Number(payload?.limit || 12),
        totalItems: Number(payload?.totalItems || 0),
        totalPages: Number(payload?.totalPages || 1),
        hasPreviousPage: Boolean(payload?.hasPreviousPage),
        hasNextPage: Boolean(payload?.hasNextPage),
        summary: normalizeStorefrontGameReviewSummary(payload?.summary),
      };
    } catch {
      return {
        items: [],
        page: 1,
        limit: 12,
        totalItems: 0,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
        summary: normalizeStorefrontGameReviewSummary(),
      };
    }
  }
);
