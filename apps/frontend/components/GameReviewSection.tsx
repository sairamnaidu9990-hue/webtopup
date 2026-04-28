import Link from "next/link";

import type { StorefrontGameReviewSummary } from "@/lib/siteData";

function formatAverageRating(value: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatCount(value: number) {
  return new Intl.NumberFormat("id-ID").format(
    Number.isFinite(value) ? value : 0
  );
}

function formatReviewDate(value?: string | null) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

function ReviewStars({
  rating,
  compact = false,
}: {
  rating: number;
  compact?: boolean;
}) {
  const roundedRating = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div
      className={`flex items-center ${
        compact ? "gap-1 text-[20px]" : "gap-1.5 text-[28px]"
      }`}
      aria-label={`Rating ${rating} dari 5`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={`review-star-${index}`}
          className={index < roundedRating ? "text-[#ffd54f]" : "text-white/14"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

type GameReviewSectionProps = {
  gameName: string;
  summary: StorefrontGameReviewSummary;
  compact?: boolean;
  showSummary?: boolean;
  showComments?: boolean;
  reviewPageHref?: string;
  maxComments?: number;
  title?: string;
  className?: string;
};

export default function GameReviewSection({
  gameName,
  summary,
  compact = false,
  showSummary = true,
  showComments = false,
  reviewPageHref = "",
  maxComments = 5,
  title = "Ulasan",
  className = "",
}: GameReviewSectionProps) {
  const hasReviews = summary.totalReviews > 0;
  const visibleComments =
    summary.commentsVisible && Array.isArray(summary.recentComments)
      ? summary.recentComments.filter((review) => review.comment).slice(0, maxComments)
      : [];
  const ratingBreakdown = Array.isArray(summary.ratingBreakdown)
    ? summary.ratingBreakdown
    : [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: 0,
      }));

  return (
    <section className={`space-y-4 ${className}`}>
      {showSummary ? (
        <div className="overflow-hidden rounded-[18px] border border-white/8 bg-[#2a2a2f] shadow-[0_12px_24px_rgba(0,0,0,0.14)]">
          <div className="flex min-h-[39px] items-stretch border-b border-white/8 bg-[#474747] sm:min-h-[40px]">
            <div className="flex w-8 shrink-0 items-center justify-center bg-[var(--accent-soft)] text-[12px] font-bold text-white sm:w-9 sm:text-[13px]">
              ★
            </div>
            <div className="flex min-w-0 items-center px-3 sm:px-3.5">
              <h2 className="truncate text-[11px] font-semibold text-white sm:text-[12px]">
                {title}
              </h2>
            </div>
          </div>

          <div className="space-y-4 bg-[#2d2d31] p-4 sm:p-5">
            {compact ? (
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <span className="text-[2.55rem] font-bold leading-none text-white sm:text-[3rem]">
                    {formatAverageRating(summary.averageRating)}
                  </span>
                  <div className="pb-1">
                    <ReviewStars rating={summary.averageRating} compact />
                  </div>
                </div>
                <div className="space-y-1 text-[12px] leading-5 text-white/68 sm:text-[13px]">
                  <p className="font-medium text-white/84">
                    {hasReviews
                      ? `Berdasarkan total ${formatCount(summary.totalReviews)} rating`
                      : `Belum ada review untuk ${gameName}`}
                  </p>
                  <p>
                    {hasReviews
                      ? `${formatCount(summary.totalComments)} komentar pelanggan berhasil masuk.`
                      : "Jadilah pelanggan pertama yang memberi rating untuk game ini."}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-[16px] bg-[#34353a] px-4 py-5">
                  <div className="flex items-center justify-center gap-3 text-center sm:justify-start">
                    <ReviewStars rating={summary.averageRating} />
                    <div className="flex items-end gap-1">
                      <span className="text-[2.7rem] font-bold leading-none text-white">
                        {formatAverageRating(summary.averageRating)}
                      </span>
                      <span className="pb-1 text-[1.2rem] font-semibold text-white/88">
                        / 5.0
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1 text-center text-[14px] leading-6 text-white/80 sm:text-left">
                    <p>
                      {hasReviews
                        ? "Pelanggan merasa puas dengan produk ini."
                        : `Belum ada ulasan untuk ${gameName}.`}
                    </p>
                    <p className="font-medium text-white">
                      {hasReviews
                        ? `Dari ${formatCount(summary.totalReviews)} ulasan.`
                        : "Jadilah pelanggan pertama yang memberi rating."}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {ratingBreakdown.map((item) => {
                    const percentage =
                      summary.totalReviews > 0
                        ? (item.count / summary.totalReviews) * 100
                        : 0;

                    return (
                      <div
                        key={`rating-breakdown-${item.rating}`}
                        className="grid grid-cols-[22px_18px_minmax(0,1fr)_max-content] items-center gap-2.5 text-[13px] text-white/86"
                      >
                        <span>{item.rating}</span>
                        <span className="text-[#ffd54f]">★</span>
                        <div className="h-3 overflow-hidden rounded-full bg-white/16">
                          <div
                            className="h-full rounded-full bg-[#ffd54f]"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-right text-[12px] text-white/68">
                          {formatCount(item.count)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {!summary.commentsVisible && hasReviews ? (
                  <div className="rounded-[14px] border border-white/8 bg-[#25262b] px-4 py-3 text-[12px] leading-6 text-white/58 sm:text-[13px]">
                    Komentar pelanggan sedang disembunyikan oleh admin. Rating total
                    tetap dihitung dari review yang masuk.
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}

      {showComments && summary.commentsVisible ? (
        <div className="space-y-3">
          {visibleComments.length > 0 ? (
            visibleComments.map((review) => (
              <article
                key={review._id}
                className="rounded-[18px] border border-white/8 bg-[#26272c] p-4 shadow-[0_12px_24px_rgba(0,0,0,0.14)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-white">
                      {review.customerDisplay}
                    </p>
                    <p className="mt-1 text-[12px] text-white/58">
                      {review.gameSnapshot?.name || gameName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <ReviewStars rating={review.rating} compact />
                    {formatReviewDate(review.createdAt) ? (
                      <p className="mt-1 text-[11px] text-white/45">
                        {formatReviewDate(review.createdAt)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-line text-[12px] leading-6 text-white/74 sm:text-[13px]">
                  “{review.comment}”
                </p>
              </article>
            ))
          ) : hasReviews ? (
            <div className="rounded-[18px] border border-dashed border-white/10 bg-[#242429] px-4 py-5 text-[12px] text-white/58 sm:text-[13px]">
              Belum ada komentar tertulis dari pelanggan untuk {gameName}.
            </div>
          ) : null}

          {reviewPageHref ? (
            <Link
              href={reviewPageHref}
              className="inline-flex h-11 items-center justify-center rounded-[14px] border border-white/10 bg-white/5 px-4 text-[13px] font-semibold text-white transition hover:border-white/18 hover:bg-white/8"
            >
              Lihat Semua Ulasan
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
