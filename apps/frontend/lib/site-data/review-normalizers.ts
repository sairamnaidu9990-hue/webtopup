import type {
  StorefrontGameReviewSummary,
  StorefrontReviewEntry,
} from "@/lib/site-data/types";

export function normalizeStorefrontReviewEntry(
  review?: Partial<StorefrontReviewEntry> | null
): StorefrontReviewEntry {
  return {
    _id: String(review?._id || "").trim(),
    customerDisplay:
      String(review?.customerDisplay || "").trim() || "Pelanggan Terverifikasi",
    rating: Number(review?.rating || 0),
    comment: String(review?.comment || "").trim(),
    invoiceNumber: String(review?.invoiceNumber || "").trim(),
    gameSnapshot: review?.gameSnapshot
      ? {
          name: String(review.gameSnapshot.name || "").trim(),
          code: String(review.gameSnapshot.code || "").trim(),
          provider: String(review.gameSnapshot.provider || "").trim(),
          category: String(review.gameSnapshot.category || "").trim(),
          logo: String(review.gameSnapshot.logo || "").trim(),
        }
      : null,
    createdAt: review?.createdAt || null,
  };
}

export function normalizeStorefrontGameReviewSummary(
  summary?: Partial<StorefrontGameReviewSummary> | null
): StorefrontGameReviewSummary {
  return {
    averageRating: Number(summary?.averageRating || 0),
    totalReviews: Number(summary?.totalReviews || 0),
    totalComments: Number(summary?.totalComments || 0),
    ratingBreakdown: Array.isArray(summary?.ratingBreakdown)
      ? summary.ratingBreakdown.map((item) => ({
          rating: Number(item?.rating || 0),
          count: Number(item?.count || 0),
        }))
      : [5, 4, 3, 2, 1].map((rating) => ({
          rating,
          count: 0,
        })),
    commentsVisible: Boolean(summary?.commentsVisible ?? true),
    recentComments: Array.isArray(summary?.recentComments)
      ? summary.recentComments.map((review) =>
          normalizeStorefrontReviewEntry(review)
        )
      : [],
  };
}
