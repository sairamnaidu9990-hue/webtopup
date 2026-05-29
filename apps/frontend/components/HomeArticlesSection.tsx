import Link from "next/link";

import type { PublicArticle } from "@/lib/siteData";
import ArticleCard from "@/components/ArticleCard";

export default function HomeArticlesSection({
  articles,
}: {
  articles: PublicArticle[];
}) {
  return (
    <section className="pt-10 sm:pt-12 lg:pt-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-lg font-semibold uppercase tracking-[0.14em] text-white">
            Artikel Terbaru & Berita Game
          </p>
          <p className="mt-3 text-sm leading-7 text-white/68 sm:text-[15px]">
            Dapatkan informasi terbaru seputar dunia game, panduan top up, promo,
            update komunitas, dan berita menarik lainnya langsung dari tim KITAGG.
          </p>
        </div>

        <Link
          href="/artikel"
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#d33b3b]/60 hover:bg-[#d33b3b]/12"
        >
          Tampilkan Lainnya...
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-[#171922] px-6 py-10 text-center text-sm text-white/45 sm:rounded-[28px]">
          Belum ada artikel published yang ditampilkan dari panel admin.
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {articles.map((article, index) => (
            <ArticleCard
              key={article._id}
              article={article}
              priority={index === 0}
            />
          ))}
        </div>
      )}
    </section>
  );
}
