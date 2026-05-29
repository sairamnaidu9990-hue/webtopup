import Image from "next/image";
import Link from "next/link";

import type { PublicArticle } from "@/lib/siteData";

const ARTICLE_CATEGORY_LABELS: Record<string, string> = {
  GAME: "Game",
  EVENT: "Jadwal Event",
  PROMO: "Promo",
  TOPUP_GUIDE: "Cara Topup",
};

function formatDate(value?: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function ArticleCard({
  article,
  priority = false,
}: {
  article: PublicArticle;
  priority?: boolean;
}) {
  const publishedLabel = formatDate(article.publishedAt || article.createdAt);
  const categoryLabel =
    ARTICLE_CATEGORY_LABELS[article.category] || "Artikel";

  return (
    <Link
      href={`/artikel/${article.slug}`}
      className="group block overflow-hidden rounded-[28px] border border-white/8 bg-[#171922] shadow-[0_20px_70px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-[2px] hover:border-[#d33b3b]/60 hover:bg-[#1b1f28]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#111217]">
        {article.coverImageUrl ? (
          <Image
            src={article.coverImageUrl}
            alt={article.title}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(211,59,59,0.22),_transparent_38%),linear-gradient(135deg,_#1f2532,_#111217)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d12]/70 via-transparent to-transparent" />
        {article.isFeatured ? (
          <span className="absolute left-4 top-4 rounded-full border border-white/12 bg-[#d33b3b]/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_30px_rgba(211,59,59,0.28)]">
            Featured
          </span>
        ) : null}
      </div>

      <div className="space-y-3 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.18em] text-white/45">
          <span className="rounded-full border border-[#d33b3b]/35 bg-[#d33b3b]/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-[#ffb3b3]">
            {categoryLabel}
          </span>
          {article.relatedGame?.name ? (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-white/70">
              {article.relatedGame.name}
            </span>
          ) : null}
          {publishedLabel ? <span>{publishedLabel}</span> : null}
          <span>{article.readingMinutes} Menit Baca</span>
        </div>
        <h3 className="line-clamp-2 font-[family-name:var(--font-display)] text-[1.35rem] font-semibold leading-tight tracking-tight text-white">
          {article.title}
        </h3>
        <p className="line-clamp-3 text-sm leading-6 text-white/60 sm:text-[15px]">
          {article.excerpt}
        </p>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#ff8d8d] transition group-hover:text-[#ffb3b3]">
          Baca artikel
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
