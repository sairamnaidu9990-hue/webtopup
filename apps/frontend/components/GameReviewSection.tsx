import type { StorefrontGameReviewSummary } from "@/lib/siteData";

function formatAverageRating(value: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatTotalReviews(totalReviews: number) {
  return new Intl.NumberFormat("id-ID").format(
    Number.isFinite(totalReviews) ? totalReviews : 0
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
    month: "short",
    year: "numeric",
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
        compact ? "gap-1 text-[24px]" : "gap-1.5 text-[28px]"
      }`}
      aria-label={`Rating ${rating} dari 5`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={`review-star-${index}`}
          className={
            index < roundedRating
              ? "text-[#ffd54f]"
              : "text-white/14"
          }
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
  className?: string;
};

export default function GameReviewSection({
  gameName,
  summary,
  compact = false,
  showSummary = true,
  showComments = false,
  className = "",
}: GameReviewSectionProps) {
  const hasReviews = summary.totalReviews > 0;
  const visibleComments =
    summary.commentsVisible && Array.isArray(summary.recentComments)
      ? summary.recentComments.filter((review) => review.comment)
      : [];

  return (
    <section className={`space-y-4 ${className}`}>
      {showSummary ? (
        <div className="overflow-hidden rounded-[18px] border border-white/8 bg-[#2a2a2f] shadow-[0_12px_24px_rgba(0,0,0,0.14)]">
          <div className="border-b border-white/8 bg-[#474747] px-4 py-3 sm:px-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/82">
              Ulasan dan rating
            </p>
          </div>

          <div className="space-y-4 bg-[#2d2d31] p-4 sm:p-5">
            <div
              className={
                compact
                  ? "space-y-3"
                  : "space-y-4 sm:grid sm:grid-cols-[auto,1fr] sm:items-center sm:gap-5 sm:space-y-0"
              }
            >
              <div className="flex items-end gap-3">
                <span className="text-[2.55rem] font-bold leading-none text-white sm:text-[3rem]">
                  {formatAverageRating(summary.averageRating)}
                </span>
              </div>

              <div className="space-y-2">
                <ReviewStars rating={summary.averageRating} compact={compact} />
                <div className="space-y-1 text-[12px] leading-5 text-white/68 sm:text-[13px]">
                  <p className="font-medium text-white/84">
                    {hasReviews
                      ? `Berdasarkan total ${formatTotalReviews(
                          summary.totalReviews
                        )} rating`
                      : `Belum ada review untuk ${gameName}`}
                  </p>
                  <p>
                    {hasReviews
                      ? summary.totalComments > 0
                        ? `${formatTotalReviews(
                            summary.totalComments
                          )} komentar pelanggan berhasil masuk.`
                        : "Belum ada komentar tertulis dari pelanggan."
                      : "Jadilah pelanggan pertama yang memberi rating untuk game ini."}
                  </p>
                </div>
              </div>
            </div>

            {!summary.commentsVisible && hasReviews ? (
              <div className="rounded-[14px] border border-white/8 bg-[#25262b] px-4 py-3 text-[12px] leading-6 text-white/58 sm:text-[13px]">
                Komentar pelanggan sedang disembunyikan oleh admin. Rating total
                tetap dihitung dari review yang masuk.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {showComments && summary.commentsVisible ? (
        visibleComments.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleComments.map((review) => (
              <article
                key={review._id}
                className="rounded-[18px] border border-white/8 bg-[#26272c] p-4 shadow-[0_12px_24px_rgba(0,0,0,0.14)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-white">
                      {review.customerDisplay}
                    </p>
                    {formatReviewDate(review.createdAt) ? (
                      <p className="mt-1 text-[11px] text-white/45">
                        {formatReviewDate(review.createdAt)}
                      </p>
                    ) : null}
                  </div>
                  <ReviewStars rating={review.rating} compact />
                </div>

                <p className="mt-4 whitespace-pre-line text-[12px] leading-6 text-white/74 sm:text-[13px]">
                  {review.comment}
                </p>
              </article>
            ))}
          </div>
        ) : hasReviews ? (
          <div className="rounded-[18px] border border-dashed border-white/10 bg-[#242429] px-4 py-5 text-[12px] text-white/58 sm:text-[13px]">
            Belum ada komentar tertulis dari pelanggan untuk {gameName}.
          </div>
        ) : null
      ) : null}
    </section>
  );
}
