import type {
  PublicArticleCategory,
  PublicArticle,
  PublicArticleGameFilter,
  PublicArticleListPage,
} from "@/lib/site-data/types";

function toStringValue(value: unknown) {
  return String(value || "").trim();
}

function toNullableString(value: unknown) {
  const normalized = toStringValue(value);
  return normalized || null;
}

export function normalizePublicArticle(value: unknown): PublicArticle {
  const item = (value || {}) as Record<string, unknown>;

  return {
    _id: toStringValue(item._id),
    title: toStringValue(item.title),
    slug: toStringValue(item.slug),
    excerpt: toStringValue(item.excerpt),
    content: String(item.content || ""),
    coverImageUrl: toStringValue(item.coverImageUrl),
    status: toStringValue(item.status || "DRAFT") as "DRAFT" | "PUBLISHED",
    category: toStringValue(item.category || "GAME") as PublicArticleCategory,
    relatedGame:
      item.relatedGame && typeof item.relatedGame === "object"
        ? {
            gameId: toStringValue(
              (item.relatedGame as Record<string, unknown>).gameId
            ),
            name: toStringValue(
              (item.relatedGame as Record<string, unknown>).name
            ),
            code: toStringValue(
              (item.relatedGame as Record<string, unknown>).code
            ),
            logo: toStringValue(
              (item.relatedGame as Record<string, unknown>).logo
            ),
            provider: toStringValue(
              (item.relatedGame as Record<string, unknown>).provider
            ),
            category: toStringValue(
              (item.relatedGame as Record<string, unknown>).category
            ),
          }
        : null,
    isFeatured: Boolean(item.isFeatured),
    sortOrder: Number(item.sortOrder ?? 9999),
    readingMinutes: Number(item.readingMinutes || 1),
    publishedAt: toNullableString(item.publishedAt),
    createdAt: toNullableString(item.createdAt),
    updatedAt: toNullableString(item.updatedAt),
    createdBy:
      item.createdBy && typeof item.createdBy === "object"
        ? {
            adminId: toStringValue((item.createdBy as Record<string, unknown>).adminId),
            name: toStringValue((item.createdBy as Record<string, unknown>).name),
            email: toStringValue((item.createdBy as Record<string, unknown>).email),
            role: toStringValue((item.createdBy as Record<string, unknown>).role),
          }
        : null,
    updatedBy:
      item.updatedBy && typeof item.updatedBy === "object"
        ? {
            adminId: toStringValue((item.updatedBy as Record<string, unknown>).adminId),
            name: toStringValue((item.updatedBy as Record<string, unknown>).name),
            email: toStringValue((item.updatedBy as Record<string, unknown>).email),
            role: toStringValue((item.updatedBy as Record<string, unknown>).role),
          }
        : null,
  };
}

export function normalizePublicArticleListPage(
  value: unknown
): PublicArticleListPage {
  const payload = (value || {}) as Record<string, unknown>;
  const items = Array.isArray(payload.items) ? payload.items : [];
  const availableGames = Array.isArray(payload.availableGames)
    ? payload.availableGames
    : [];

  return {
    items: items.map((item) => normalizePublicArticle(item)),
    availableGames: availableGames.map((item) => {
      const game = (item || {}) as Record<string, unknown>;

      return {
        gameId: toStringValue(game.gameId),
        name: toStringValue(game.name),
        code: toStringValue(game.code),
        logo: toStringValue(game.logo),
        provider: toStringValue(game.provider),
        articleCount: Number(game.articleCount || 0),
      } satisfies PublicArticleGameFilter;
    }),
    filters:
      payload.filters && typeof payload.filters === "object"
        ? {
            category: toStringValue(
              (payload.filters as Record<string, unknown>).category
            ),
            game: toStringValue(
              (payload.filters as Record<string, unknown>).game
            ),
          }
        : {
            category: "",
            game: "",
          },
    page: Number(payload.page || 1),
    limit: Number(payload.limit || 6),
    totalItems: Number(payload.totalItems || 0),
    totalPages: Number(payload.totalPages || 1),
    hasPreviousPage: Boolean(payload.hasPreviousPage),
    hasNextPage: Boolean(payload.hasNextPage),
  };
}
