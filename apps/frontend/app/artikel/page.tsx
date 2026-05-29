import type { Metadata } from "next";
import Link from "next/link";

import ArticleCard from "@/components/ArticleCard";
import { getPublicArticles, getPublicSiteSetting } from "@/lib/siteData";
import { getAbsoluteSiteUrl, getMetadataBase } from "@/lib/seo";

const ARTICLE_CATEGORY_LABELS: Record<string, string> = {
  EVENT: "Jadwal Event",
  PROMO: "Promo",
  TOPUP_GUIDE: "Cara Topup",
};

type ArticlesListingPageProps = {
  searchParams?: Promise<{
    page?: string;
    category?: string;
    game?: string;
  }>;
};

function resolvePageValue(rawPage?: string) {
  const requestedPage = Number.parseInt(String(rawPage || "1"), 10);
  return Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
}

function resolveCategoryValue(rawCategory?: string) {
  const normalized = String(rawCategory || "").trim().toUpperCase();
  return ["GAME", "EVENT", "PROMO", "TOPUP_GUIDE"].includes(normalized)
    ? normalized
    : "";
}

function resolveGameValue(rawGame?: string) {
  return String(rawGame || "").trim().toUpperCase();
}

function buildArticlesHref(options?: {
  page?: number;
  category?: string;
  game?: string;
}) {
  const params = new URLSearchParams();

  if (options?.page && options.page > 1) {
    params.set("page", String(options.page));
  }

  if (options?.category) {
    params.set("category", options.category);
  }

  if (options?.game) {
    params.set("game", options.game);
  }

  const query = params.toString();
  return query ? `/artikel?${query}` : "/artikel";
}

function buildArticlesHeading(options: {
  category: string;
  selectedGameName: string;
}) {
  if (options.category === "GAME" && options.selectedGameName) {
    return {
      title: `Artikel ${options.selectedGameName}`,
      description: `Kumpulan artikel, update, dan panduan untuk ${options.selectedGameName} dari tim KITAGG.`,
    };
  }

  if (options.category === "GAME") {
    return {
      title: "Artikel Game",
      description:
        "Kumpulan artikel game, pembahasan update, dan panduan per game yang bisa kamu jelajahi dari dropdown pilihan game.",
    };
  }

  if (options.category && ARTICLE_CATEGORY_LABELS[options.category]) {
    return {
      title: ARTICLE_CATEGORY_LABELS[options.category],
      description:
        options.category === "EVENT"
          ? "Jadwal event, agenda komunitas, dan update kompetitif terbaru dari dunia game."
          : options.category === "PROMO"
            ? "Promo top up, diskon spesial, dan penawaran terbatas terbaru dari KITAGG."
            : "Panduan isi saldo, langkah top up, dan tips transaksi yang mudah dipahami user.",
    };
  }

  return {
    title: "Artikel, Berita Game, dan Panduan Top Up",
    description:
      "Kumpulan artikel terbaru dari tim KITAGG untuk bantu user mengikuti promo, update game, dan tips bermain yang relevan.",
  };
}

export async function generateMetadata({
  searchParams,
}: ArticlesListingPageProps): Promise<Metadata> {
  const [siteSetting, resolvedSearchParams] = await Promise.all([
    getPublicSiteSetting(),
    searchParams,
  ]);
  const page = resolvePageValue(resolvedSearchParams?.page);
  const category = resolveCategoryValue(resolvedSearchParams?.category);
  const game = resolveGameValue(resolvedSearchParams?.game);
  const articles = await getPublicArticles({
    page: 1,
    limit: 1,
    category,
    game,
  });
  const selectedGameName =
    articles.availableGames.find((item) => item.code === game)?.name || "";
  const heading = buildArticlesHeading({
    category,
    selectedGameName,
  });
  const title =
    page > 1
      ? `${heading.title} - Halaman ${page} | ${siteSetting.siteName}`
      : `${heading.title} | ${siteSetting.siteName}`;
  const description = heading.description;
  const metadataBase = getMetadataBase(siteSetting.siteDomain);
  const canonicalPath = buildArticlesHref({
    page,
    category,
    game,
  });
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
  const category = resolveCategoryValue(resolvedSearchParams.category);
  const game = resolveGameValue(resolvedSearchParams.game);
  const result = await getPublicArticles({
    page,
    limit: 9,
    category,
    game,
  });
  const selectedGameName =
    result.availableGames.find((item) => item.code === game)?.name || "";
  const heading = buildArticlesHeading({
    category,
    selectedGameName,
  });

  return (
    <main className="site-shell pb-10 pt-6 sm:pb-12 sm:pt-8">
      <section className="rounded-[30px] border border-white/8 bg-[#171922] px-5 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:px-7 sm:py-10 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/45">
            KITAGG Journal
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.04] tracking-tight text-white sm:text-5xl">
            {heading.title}
          </h1>
          <p className="mt-5 text-base leading-8 text-white/60 sm:text-lg">
            {heading.description}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={buildArticlesHref()}
            className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
              !category
                ? "border-[#d33b3b]/50 bg-[#d33b3b]/16 text-white shadow-[0_14px_30px_rgba(211,59,59,0.18)]"
                : "border-white/10 bg-white/[0.03] text-white/72 hover:border-[#d33b3b]/50 hover:bg-[#d33b3b]/10 hover:text-white"
            }`}
          >
            Artikel
          </Link>

          <details className="group relative">
            <summary
              className={`inline-flex cursor-pointer list-none items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                category === "GAME"
                  ? "border-[#d33b3b]/50 bg-[#d33b3b]/16 text-white shadow-[0_14px_30px_rgba(211,59,59,0.18)]"
                  : "border-white/10 bg-white/[0.03] text-white/72 hover:border-[#d33b3b]/50 hover:bg-[#d33b3b]/10 hover:text-white"
              }`}
            >
              Games
              <span className="text-xs transition group-open:rotate-180">▾</span>
            </summary>
            <div className="absolute left-0 top-full z-20 mt-3 min-w-[260px] rounded-[24px] border border-white/10 bg-[#171922] p-3 shadow-[0_26px_70px_rgba(0,0,0,0.36)]">
              <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                <Link
                  href={buildArticlesHref({ category: "GAME" })}
                  className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm transition ${
                    category === "GAME" && !game
                      ? "bg-[#d33b3b]/14 text-white"
                      : "text-white/72 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span>Semua Artikel Game</span>
                </Link>
                {result.availableGames.map((gameItem) => (
                  <Link
                    key={gameItem.code}
                    href={buildArticlesHref({
                      category: "GAME",
                      game: gameItem.code,
                    })}
                    className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                      game === gameItem.code
                        ? "bg-[#d33b3b]/14 text-white"
                        : "text-white/72 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <span className="truncate">{gameItem.name}</span>
                    <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] text-white/55">
                      {gameItem.articleCount}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </details>

          {Object.entries(ARTICLE_CATEGORY_LABELS).map(([value, label]) => (
            <Link
              key={value}
              href={buildArticlesHref({ category: value })}
              className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
                category === value
                  ? "border-[#d33b3b]/50 bg-[#d33b3b]/16 text-white shadow-[0_14px_30px_rgba(211,59,59,0.18)]"
                  : "border-white/10 bg-white/[0.03] text-white/72 hover:border-[#d33b3b]/50 hover:bg-[#d33b3b]/10 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
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
              href={
                result.hasPreviousPage
                  ? buildArticlesHref({
                      page: result.page - 1,
                      category,
                      game,
                    })
                  : "#"
              }
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
              href={
                result.hasNextPage
                  ? buildArticlesHref({
                      page: result.page + 1,
                      category,
                      game,
                    })
                  : "#"
              }
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
