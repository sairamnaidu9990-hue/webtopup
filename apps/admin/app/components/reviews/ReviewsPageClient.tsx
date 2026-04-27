"use client";

import { useDeferredValue, useEffect, useState } from "react";
import Card from "@/app/components/ui/Card";
import PaginationControls from "@/app/components/ui/PaginationControls";
import SectionTitle from "@/app/components/ui/SectionTitle";
import { getResponseMessage, parseJsonSafely } from "@/app/lib/http";
import type { Review, ReviewSummary } from "@/app/types/Review";

const PAGE_LIMIT = 20;
const HIDDEN_FILTER_OPTIONS = ["ALL", "VISIBLE", "HIDDEN"] as const;
const RATING_FILTER_OPTIONS = ["ALL", "5", "4", "3", "2", "1"] as const;

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatRating(value = 0) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function ReviewStars({ rating }: { rating: number }) {
  const roundedRating = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div className="flex items-center gap-1 text-[18px] leading-none">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={`admin-review-star-${index}`}
          className={index < roundedRating ? "text-[#f4b63f]" : "text-gray-200"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

const emptySummary: ReviewSummary = {
  totalReviews: 0,
  averageRating: 0,
  hiddenComments: 0,
};

export default function ReviewsPageClient() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>(emptySummary);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [hiddenFilter, setHiddenFilter] =
    useState<(typeof HIDDEN_FILTER_OPTIONS)[number]>("ALL");
  const [ratingFilter, setRatingFilter] =
    useState<(typeof RATING_FILTER_OPTIONS)[number]>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  const deferredSearch = useDeferredValue(search);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_LIMIT),
      });

      if (deferredSearch.trim()) {
        params.set("search", deferredSearch.trim());
      }

      if (hiddenFilter !== "ALL") {
        params.set("hidden", hiddenFilter);
      }

      if (ratingFilter !== "ALL") {
        params.set("rating", ratingFilter);
      }

      const response = await fetch(`/api/reviews?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = await parseJsonSafely<{
        items?: Review[];
        page?: number;
        totalItems?: number;
        totalPages?: number;
        summary?: ReviewSummary;
        message?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal ambil data review"));
      }

      const nextItems = Array.isArray(payload?.items) ? payload.items : [];
      setReviews(nextItems);
      setSummary(payload?.summary || emptySummary);
      setTotalItems(Number(payload?.totalItems || 0));
      setTotalPages(Number(payload?.totalPages || 1));
      setPage(Number(payload?.page || 1));
      setDraftNotes((current) => {
        const next = { ...current };

        nextItems.forEach((review) => {
          if (next[review._id] === undefined) {
            next[review._id] = review.adminNote || "";
          }
        });

        return next;
      });
    } catch (fetchError) {
      setReviews([]);
      setSummary(emptySummary);
      setTotalItems(0);
      setTotalPages(1);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Gagal ambil data review"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReviews();
  }, [page, deferredSearch, hiddenFilter, ratingFilter]);

  const handleReviewUpdate = async (
    review: Review,
    body: { isCommentHidden?: boolean; adminNote?: string }
  ) => {
    try {
      setUpdatingId(review._id);
      const response = await fetch(`/api/reviews/${review._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const payload = await parseJsonSafely<{
        message?: string;
        review?: Review;
      }>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal update review"));
      }

      if (payload?.review) {
        setReviews((current) =>
          current.map((item) =>
            item._id === payload.review?._id ? payload.review : item
          )
        );
        setDraftNotes((current) => ({
          ...current,
          [review._id]: payload.review?.adminNote || "",
        }));
      }

      void fetchReviews();
    } catch (updateError) {
      alert(
        updateError instanceof Error
          ? updateError.message
          : "Gagal update review"
      );
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Reviews"
        subtitle="Pantau rating pelanggan dari invoice yang berhasil, moderasi komentar publik, dan simpan catatan admin bila diperlukan."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Total Reviews" variant="info">
          <p className="text-4xl font-bold tracking-tight">
            {summary.totalReviews}
          </p>
        </Card>

        <Card title="Rata-rata Rating" variant="warning">
          <div className="space-y-2">
            <p className="text-4xl font-bold tracking-tight">
              {formatRating(summary.averageRating)}
            </p>
            <ReviewStars rating={summary.averageRating} />
          </div>
        </Card>

        <Card title="Komentar Disembunyikan" variant="danger">
          <p className="text-4xl font-bold tracking-tight">
            {summary.hiddenComments}
          </p>
        </Card>
      </div>

      <Card title="Daftar Review Pelanggan">
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cari Review
              </label>
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Invoice, game, provider, pelanggan, komentar"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status Komentar
              </label>
              <select
                value={hiddenFilter}
                onChange={(event) => {
                  setHiddenFilter(
                    event.target.value as (typeof HIDDEN_FILTER_OPTIONS)[number]
                  );
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
              >
                {HIDDEN_FILTER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "ALL"
                      ? "Semua komentar"
                      : option === "VISIBLE"
                      ? "Komentar tampil"
                      : "Komentar disembunyikan"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Filter Rating
              </label>
              <select
                value={ratingFilter}
                onChange={(event) => {
                  setRatingFilter(
                    event.target.value as (typeof RATING_FILTER_OPTIONS)[number]
                  );
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
              >
                {RATING_FILTER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "ALL" ? "Semua rating" : `${option} bintang`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Memuat data review...</p>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
              {error}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              Belum ada review yang masuk untuk filter ini.
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <article
                  key={review._id}
                  className="rounded-[24px] border border-[#f1d6d6] bg-white p-5 shadow-[0_20px_44px_rgba(125,19,19,0.08)] sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#f8e5e5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9f2424]">
                          {review.invoiceNumber}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                            review.isCommentHidden
                              ? "bg-[#fff3cd] text-[#8a6d1d]"
                              : "bg-[#e8f5e9] text-[#1f6a37]"
                          }`}
                        >
                          {review.isCommentHidden
                            ? "Komentar Disembunyikan"
                            : "Komentar Tampil"}
                        </span>
                      </div>

                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {review.gameSnapshot?.name || "-"}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {review.gameSnapshot?.provider || "Provider game"} •{" "}
                          {review.gameSnapshot?.category || "Tanpa kategori"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <ReviewStars rating={review.rating} />
                        <span className="text-sm font-semibold text-gray-700">
                          {review.rating}/5
                        </span>
                        <span className="text-sm text-gray-500">
                          {review.customerDisplay}
                        </span>
                        <span className="text-sm text-gray-400">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleReviewUpdate(review, {
                            isCommentHidden: !review.isCommentHidden,
                            adminNote: draftNotes[review._id] ?? review.adminNote,
                          })
                        }
                        disabled={updatingId === review._id}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-900 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updatingId === review._id
                          ? "Memproses..."
                          : review.isCommentHidden
                          ? "Tampilkan Komentar"
                          : "Hide Komentar"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
                    <div className="rounded-[18px] border border-gray-200 bg-gray-50 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                        Komentar Pelanggan
                      </p>
                      <p className="mt-3 whitespace-pre-line text-[14px] leading-7 text-gray-700">
                        {review.comment || "Pelanggan hanya memberi rating tanpa komentar."}
                      </p>
                    </div>

                    <div className="rounded-[18px] border border-gray-200 bg-[#fffaf9] px-4 py-4">
                      <label
                        htmlFor={`review-note-${review._id}`}
                        className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500"
                      >
                        Catatan Admin
                      </label>
                      <textarea
                        id={`review-note-${review._id}`}
                        value={draftNotes[review._id] ?? review.adminNote ?? ""}
                        onChange={(event) =>
                          setDraftNotes((current) => ({
                            ...current,
                            [review._id]: event.target.value,
                          }))
                        }
                        rows={5}
                        placeholder="Catatan internal untuk review ini..."
                        className="mt-3 min-h-[126px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-black"
                      />

                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            handleReviewUpdate(review, {
                              adminNote:
                                draftNotes[review._id] ?? review.adminNote,
                            })
                          }
                          disabled={updatingId === review._id}
                          className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updatingId === review._id
                            ? "Menyimpan..."
                            : "Simpan Catatan"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            limit={PAGE_LIMIT}
            itemLabel="review"
            onPageChange={setPage}
          />
        </div>
      </Card>
    </div>
  );
}
