"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import GameReviewSection from "@/components/GameReviewSection";
import type { PublicReviewsPage } from "@/lib/siteData";

const PAGE_LIMIT = 12;

function createEmptyReviewPage(): PublicReviewsPage {
  return {
    items: [],
    page: 1,
    limit: PAGE_LIMIT,
    totalItems: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
    summary: {
      averageRating: 0,
      totalReviews: 0,
      totalComments: 0,
      ratingBreakdown: [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: 0,
      })),
      commentsVisible: true,
      recentComments: [],
    },
  };
}

function getResponseMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string" &&
    payload.message.trim()
  ) {
    return payload.message;
  }

  return fallback;
}

export default function ReviewsPageClient() {
  const searchParams = useSearchParams();
  const gameCode = String(searchParams.get("game") || "").trim().toUpperCase();
  const gameName = String(searchParams.get("name") || "").trim();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PublicReviewsPage>(createEmptyReviewPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPage(1);
  }, [gameCode]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_LIMIT),
        });

        if (gameCode) {
          params.set("gameCode", gameCode);
        }

        const response = await fetch(`/api/reviews/public?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            getResponseMessage(payload, "Gagal memuat daftar ulasan")
          );
        }

        setData({
          items: Array.isArray(payload?.items) ? payload.items : [],
          page: Number(payload?.page || 1),
          limit: Number(payload?.limit || PAGE_LIMIT),
          totalItems: Number(payload?.totalItems || 0),
          totalPages: Number(payload?.totalPages || 1),
          hasPreviousPage: Boolean(payload?.hasPreviousPage),
          hasNextPage: Boolean(payload?.hasNextPage),
          summary: payload?.summary || createEmptyReviewPage().summary,
        });
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") {
          return;
        }

        setData(createEmptyReviewPage());
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Gagal memuat daftar ulasan"
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchReviews();

    return () => controller.abort();
  }, [gameCode, page]);

  return (
    <main className="site-shell pb-10 pt-6 sm:pb-12 sm:pt-8">
      <section className="space-y-6">
        <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(135deg,#1d2027_0%,#17191f_100%)] px-5 py-6 shadow-[0_18px_42px_rgba(0,0,0,0.18)] sm:px-6 sm:py-7">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--accent-soft)]">
            Review Pelanggan
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[1.55rem] font-bold tracking-tight text-white sm:text-[2rem]">
            {gameName ? `Ulasan ${gameName}` : "Semua Ulasan KITAGG"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62 sm:text-[15px]">
            {gameName
              ? `Semua pengalaman pelanggan untuk ${gameName} kami kumpulkan di sini agar calon pembeli bisa menilai layanan dengan lebih yakin.`
              : "Lihat pengalaman pelanggan dari berbagai game dan product yang tersedia di KITAGG."}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={gameCode ? `/games/${gameCode.toLowerCase()}` : "/"}
              className="inline-flex h-11 items-center justify-center rounded-[14px] border border-white/10 bg-white/5 px-5 text-[13px] font-medium text-white transition hover:border-white/18 hover:bg-white/8"
            >
              {gameCode ? "Kembali ke Halaman Game" : "Kembali ke Home"}
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[20px] border border-white/8 bg-[#24262d] px-5 py-6 text-sm text-white/62">
            Memuat ulasan pelanggan...
          </div>
        ) : error ? (
          <div className="rounded-[20px] border border-rose-400/20 bg-rose-500/10 px-5 py-5 text-sm text-rose-100">
            {error}
          </div>
        ) : (
          <div className="space-y-5">
            <GameReviewSection
              gameName={gameName || "KITAGG"}
              summary={{
                ...data.summary,
                recentComments: data.items,
              }}
              showComments
              maxComments={data.items.length || 5}
              title={gameName ? `Ulasan ${gameName}` : "Ulasan Pelanggan"}
            />

            <div className="flex items-center justify-between gap-3 rounded-[18px] border border-white/8 bg-[#24262d] px-4 py-4 text-[13px] text-white/68">
              <span>
                Menampilkan {data.items.length} dari {data.totalItems} ulasan
              </span>
              <span>
                Halaman {data.page} / {data.totalPages}
              </span>
            </div>

            {(data.hasPreviousPage || data.hasNextPage) ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={!data.hasPreviousPage}
                  className="inline-flex h-11 items-center justify-center rounded-[14px] border border-white/10 bg-white/5 px-5 text-[13px] font-medium text-white transition hover:border-white/18 hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Ulasan Sebelumnya
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(data.totalPages, current + 1))
                  }
                  disabled={!data.hasNextPage}
                  className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,var(--accent-strong)_0%,var(--accent)_100%)] px-5 text-[13px] font-semibold text-white shadow-[0_14px_28px_var(--accent-glow)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Ulasan Berikutnya
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
