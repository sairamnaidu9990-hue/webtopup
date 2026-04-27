"use client";

import { useState } from "react";

import type { StorefrontOrderReviewState } from "@/lib/siteData";

function ReviewStarsInput({
  rating,
  onChange,
  disabled,
}: {
  rating: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 5 }, (_, index) => {
        const value = index + 1;
        const active = value <= rating;

        return (
          <button
            key={`review-input-star-${value}`}
            type="button"
            onClick={() => onChange(value)}
            disabled={disabled}
            className={`text-[30px] leading-none transition ${
              active ? "text-[#ffd54f]" : "text-white/16 hover:text-white/38"
            } disabled:cursor-not-allowed disabled:opacity-70`}
            aria-label={`Pilih rating ${value}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

function ReviewStarsDisplay({ rating }: { rating: number }) {
  const roundedRating = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div className="flex items-center gap-1 text-[24px] leading-none">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={`review-display-star-${index}`}
          className={index < roundedRating ? "text-[#ffd54f]" : "text-white/14"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function parseResponsePayload(payload: unknown, fallback: string) {
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

function extractCreatedAtFromPayload(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "review" in payload &&
    payload.review &&
    typeof payload.review === "object" &&
    "createdAt" in payload.review
  ) {
    return String(payload.review.createdAt || "") || new Date().toISOString();
  }

  return new Date().toISOString();
}

type InvoiceReviewCardProps = {
  invoiceNumber: string;
  gameName: string;
  initialReviewState: StorefrontOrderReviewState;
};

export default function InvoiceReviewCard({
  invoiceNumber,
  gameName,
  initialReviewState,
}: InvoiceReviewCardProps) {
  const [reviewState, setReviewState] =
    useState<StorefrontOrderReviewState>(initialReviewState);
  const [rating, setRating] = useState(initialReviewState.review?.rating || 0);
  const [comment, setComment] = useState(initialReviewState.review?.comment || "");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  if (!reviewState.canSubmit && !reviewState.hasSubmitted) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!rating) {
      setErrorMessage("Silakan pilih rating bintang terlebih dahulu.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceNumber,
          rating,
          comment,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          parseResponsePayload(payload, "Gagal mengirim ulasan transaksi")
        );
      }

      setReviewState({
        canSubmit: false,
        hasSubmitted: true,
        review: {
          rating,
          comment: String(comment || "").trim(),
          createdAt: extractCreatedAtFromPayload(payload),
        },
      });
      setSuccessMessage(
        parseResponsePayload(payload, "Terima kasih, review berhasil dikirim.")
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengirim ulasan transaksi"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-[24px] border border-white/8 bg-[linear-gradient(135deg,#1d2027_0%,#17191f_100%)] shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
      <div className="border-b border-white/8 bg-[linear-gradient(180deg,rgba(211,59,59,0.16)_0%,rgba(211,59,59,0.05)_100%)] px-5 py-5 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--accent-soft)]">
          Review Transaksi
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-[1.2rem] font-bold tracking-tight text-white sm:text-[1.45rem]">
          Bagaimana pengalaman top up {gameName} kamu?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
          Rating dan komentar kamu membantu pelanggan lain memilih dengan lebih
          yakin.
        </p>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        {successMessage ? (
          <div className="rounded-[16px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-100">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-[16px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-100">
            {errorMessage}
          </div>
        ) : null}

        {reviewState.hasSubmitted && reviewState.review ? (
          <div className="rounded-[18px] border border-white/8 bg-[#24262d] p-4 sm:p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/52">
              Review Terkirim
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <ReviewStarsDisplay rating={reviewState.review.rating} />
              <p className="text-[13px] text-white/58">
                Terima kasih, ulasanmu sudah masuk.
              </p>
            </div>

            {reviewState.review.comment ? (
              <div className="mt-4 rounded-[16px] border border-white/8 bg-[#2c2f37] px-4 py-4 text-[13px] leading-6 text-white/78">
                {reviewState.review.comment}
              </div>
            ) : (
              <p className="mt-4 text-[13px] text-white/58">
                Kamu memberi rating tanpa komentar tambahan.
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-[18px] border border-white/8 bg-[#24262d] p-4 sm:p-5">
              <label className="block text-[12px] font-semibold uppercase tracking-[0.18em] text-white/52">
                Rating Bintang
              </label>
              <div className="mt-3">
                <ReviewStarsInput
                  rating={rating}
                  onChange={setRating}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="rounded-[18px] border border-white/8 bg-[#24262d] p-4 sm:p-5">
              <label
                htmlFor="invoice-review-comment"
                className="block text-[12px] font-semibold uppercase tracking-[0.18em] text-white/52"
              >
                Ceritakan pengalamanmu
              </label>
              <textarea
                id="invoice-review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Tulis pengalaman kamu saat top up di KITAGG..."
                rows={5}
                maxLength={1200}
                disabled={submitting}
                className="mt-3 min-h-[140px] w-full rounded-[16px] border border-white/8 bg-[#2c2f37] px-4 py-3 text-[14px] text-white outline-none transition placeholder:text-white/28 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)] disabled:cursor-not-allowed disabled:opacity-70"
              />
              <p className="mt-2 text-[12px] text-white/46">
                Komentar bersifat opsional, tapi sangat membantu pelanggan lain.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,var(--accent-strong)_0%,var(--accent)_100%)] px-6 text-[14px] font-semibold text-white shadow-[0_14px_28px_var(--accent-glow)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Mengirim Review..." : "Kirim Review"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
