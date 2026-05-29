import { cache } from "react";

import { buildFrontendApiUrl } from "@/lib/runtimeConfig";
import {
  normalizePublicArticle,
  normalizePublicArticleListPage,
} from "@/lib/site-data/article-normalizers";
import type { PublicArticle, PublicArticleListPage } from "@/lib/site-data/types";

export const getPublicArticles = cache(
  async (options?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    game?: string;
  }): Promise<PublicArticleListPage> => {
    try {
      const params = new URLSearchParams();

      if (options?.page) {
        params.set("page", String(options.page));
      }

      if (options?.limit) {
        params.set("limit", String(options.limit));
      }

      if (options?.search?.trim()) {
        params.set("search", options.search.trim());
      }

      if (options?.category?.trim()) {
        params.set("category", options.category.trim());
      }

      if (options?.game?.trim()) {
        params.set("game", options.game.trim());
      }

      const queryString = params.toString();
      const endpoint = queryString
        ? `/api/articles/public?${queryString}`
        : "/api/articles/public";
      const response = await fetch(await buildFrontendApiUrl(endpoint), {
        next: {
          revalidate: 120,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch public articles");
      }

      return normalizePublicArticleListPage(await response.json());
    } catch {
      return {
        items: [],
        availableGames: [],
        filters: {
          category: options?.category || "",
          game: options?.game || "",
        },
        page: options?.page || 1,
        limit: options?.limit || 6,
        totalItems: 0,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    }
  }
);

export const getPublicArticleBySlug = cache(
  async (slug: string): Promise<PublicArticle | null> => {
    const normalizedSlug = String(slug || "").trim().toLowerCase();

    if (!normalizedSlug) {
      return null;
    }

    try {
      const response = await fetch(
        await buildFrontendApiUrl(
          `/api/articles/public/${encodeURIComponent(normalizedSlug)}`
        ),
        {
          next: {
            revalidate: 120,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch public article");
      }

      const payload = await response.json();

      if (!payload?.item) {
        return null;
      }

      return normalizePublicArticle(payload.item);
    } catch {
      return null;
    }
  }
);
