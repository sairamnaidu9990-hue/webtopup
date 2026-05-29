import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import ArticleRichContent from "@/components/ArticleRichContent";
import { getPublicArticleBySlug, getPublicArticles, getPublicSiteSetting } from "@/lib/siteData";

type ArticleDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDate(value?: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export async function generateMetadata({
  params,
}: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [article, siteSetting] = await Promise.all([
    getPublicArticleBySlug(slug),
    getPublicSiteSetting(),
  ]);

  if (!article) {
    return {
      title: "Artikel Tidak Ditemukan | KITAGG",
      description: "Artikel yang kamu cari tidak tersedia.",
    };
  }

  const title = `${article.title} | ${siteSetting.siteName}`;

  return {
    title,
    description: article.excerpt,
    openGraph: {
      title,
      description: article.excerpt,
      images: article.coverImageUrl
        ? [
            {
              url: article.coverImageUrl,
              alt: article.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: article.excerpt,
      images: article.coverImageUrl ? [article.coverImageUrl] : undefined,
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: ArticleDetailPageProps) {
  const { slug } = await params;
  const [article, relatedArticles] = await Promise.all([
    getPublicArticleBySlug(slug),
    getPublicArticles({ limit: 3 }),
  ]);

  if (!article) {
    notFound();
  }

  const publishedLabel = formatDate(article.publishedAt || article.createdAt);
  const nextRelatedArticles = relatedArticles.items.filter(
    (item) => item.slug !== article.slug
  );

  return (
    <main className="site-shell pb-10 pt-6 sm:pb-12 sm:pt-8">
      <article className="overflow-hidden rounded-[30px] border border-white/8 bg-[#171922] shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <div className="relative aspect-[16/8] overflow-hidden bg-[#111217]">
          {article.coverImageUrl ? (
            <Image
              src={article.coverImageUrl}
              alt={article.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(211,59,59,0.22),_transparent_38%),linear-gradient(135deg,_#1f2532,_#111217)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f14] via-[#0d0f14]/35 to-transparent" />
        </div>

        <div className="px-5 py-7 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
            <Link href="/artikel" className="transition hover:text-white/80">
              Artikel
            </Link>
            {publishedLabel ? <span>{publishedLabel}</span> : null}
            <span>{article.readingMinutes} Menit Baca</span>
            {article.isFeatured ? <span>Featured</span> : null}
          </div>

          <h1 className="mt-5 max-w-4xl font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.06] tracking-tight text-white sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/62 sm:text-lg">
            {article.excerpt}
          </p>

          <div className="mt-8 border-t border-white/8 pt-8">
            <ArticleRichContent content={article.content} />
          </div>
        </div>
      </article>

      {nextRelatedArticles.length > 0 ? (
        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold uppercase tracking-[0.14em] text-white">
                Artikel Lainnya
              </p>
              <p className="mt-2 text-sm text-white/60">
                Baca juga update terbaru lainnya dari tim KITAGG.
              </p>
            </div>

            <Link
              href="/artikel"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#d33b3b]/60 hover:bg-[#d33b3b]/12"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {nextRelatedArticles.map((relatedArticle) => (
              <Link
                key={relatedArticle._id}
                href={`/artikel/${relatedArticle.slug}`}
                className="group rounded-[24px] border border-white/8 bg-[#171922] p-5 transition hover:border-[#d33b3b]/60 hover:bg-[#1b1f28]"
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  {formatDate(relatedArticle.publishedAt || relatedArticle.createdAt)}
                </p>
                <h2 className="mt-3 line-clamp-2 font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight tracking-tight text-white">
                  {relatedArticle.title}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-white/60">
                  {relatedArticle.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
