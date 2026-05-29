import type { Metadata } from "next";
import Link from "next/link";

import ArticleCard from "@/components/ArticleCard";
import { getPublicArticles, getPublicSiteSetting } from "@/lib/siteData";
import { getAbsoluteSiteUrl, getMetadataBase } from "@/lib/seo";

type ArticlesListingPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

function resolvePageValue(rawPage?: string) {
  const requestedPage = Number.parseInt(String(rawPage || "1"), 10);
  return Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
}

export async function generateMetadata({
  searchParams,
}: ArticlesListingPageProps): Promise<Metadata> {
  const [siteSetting, resolvedSearchParams] = await Promise.all([
    getPublicSiteSetting(),
    searchParams,
  ]);
  const page = resolvePageValue(resolvedSearchParams?.page);
  const title =
    page > 1
      ? `Artikel & Berita Game - Halaman ${page} | ${siteSetting.siteName}`
      : `Artikel & Berita Game | ${siteSetting.siteName}`;
  const description =
    "Baca artikel terbaru, berita game, panduan top up, dan update promo dari KITAGG.";
  const metadataBase = getMetadataBase(siteSetting.siteDomain);
  const canonicalPath = page > 1 ? `/artikel?page=${page}` : "/artikel";
  const canonicalUrl = getAbsoluteSiteUrl(siteSetting.siteDomain, canonicalPath);

  return {
    title,
    description,
    alternates: metadataBase
      ? {
          canonical: canonicalPath,
        }
      : undefined,
    openGraph: {
      title,
      description,
      type: "website",
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ArticlesListingPage({
  searchParams,
}: ArticlesListingPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const page = resolvePageValue(resolvedSearchParams.page);
  const result = await getPublicArticles({
    page,
    limit: 9,
  });

  return (
    <main className="site-shell pb-10 pt-6 sm:pb-12 sm:pt-8">
      <section className="rounded-[30px] border border-white/8 bg-[#171922] px-5 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:px-7 sm:py-10 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/45">
            KITAGG Journal
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.04] tracking-tight text-white sm:text-5xl">
            Artikel, Berita Game, dan Panduan Top Up
          </h1>
          <p className="mt-5 text-base leading-8 text-white/60 sm:text-lg">
            Kumpulan artikel terbaru dari tim KITAGG untuk bantu user mengikuti
            promo, update game, dan tips bermain yang relevan.
          </p>
        </div>
      </section>

      {result.items.length === 0 ? (
        <div className="mt-8 rounded-[24px] border border-dashed border-white/10 bg-[#171922] px-6 py-10 text-center text-sm text-white/45 sm:rounded-[28px]">
          Belum ada artikel yang dipublikasikan.
        </div>
      ) : (
        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {result.items.map((article, index) => (
            <ArticleCard
              key={article._id}
              article={article}
              priority={page === 1 && index === 0}
            />
          ))}
        </section>
      )}

      {result.totalPages > 1 ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-white/8 bg-[#171922] px-5 py-4 text-sm text-white/68 sm:px-6">
          <p>
            Halaman {result.page} dari {result.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={result.hasPreviousPage ? `/artikel?page=${result.page - 1}` : "#"}
              aria-disabled={!result.hasPreviousPage}
              className={`rounded-full px-4 py-2 font-semibold transition ${
                result.hasPreviousPage
                  ? "border border-white/10 bg-white/[0.03] text-white hover:border-[#d33b3b]/60 hover:bg-[#d33b3b]/12"
                  : "pointer-events-none border border-white/5 bg-white/[0.02] text-white/28"
              }`}
            >
              Sebelumnya
            </Link>
            <Link
              href={result.hasNextPage ? `/artikel?page=${result.page + 1}` : "#"}
              aria-disabled={!result.hasNextPage}
              className={`rounded-full px-4 py-2 font-semibold transition ${
                result.hasNextPage
                  ? "border border-white/10 bg-white/[0.03] text-white hover:border-[#d33b3b]/60 hover:bg-[#d33b3b]/12"
                  : "pointer-events-none border border-white/5 bg-white/[0.02] text-white/28"
              }`}
            >
              Berikutnya
            </Link>
          </div>
        </div>
      ) : null}
    </main>
  );
}
