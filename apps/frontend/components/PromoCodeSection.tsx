"use client";

import { useCallback, useEffect, useState } from "react";
import PromoCodeDialog from "@/components/PromoCodeDialog";
import type { StorefrontPromoCode } from "@/lib/siteData";

type FeedbackTone = "success" | "error" | "info";

type FeedbackState = {
  tone: FeedbackTone;
  message: string;
} | null;

export type AppliedPromoCode = StorefrontPromoCode;

type PromoValidationResponse = {
  message?: string;
  promoCode?: StorefrontPromoCode;
  discountAmount?: number;
};

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency || "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency || "IDR"} ${value}`;
  }
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

function getFeedbackClasses(tone: FeedbackTone) {
  switch (tone) {
    case "success":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
    case "error":
      return "border-[rgba(211,59,59,0.28)] bg-[rgba(211,59,59,0.12)] text-[#ffd2d2]";
    default:
      return "border-white/10 bg-white/[0.06] text-white/78";
  }
}

async function parseJson<T = unknown>(response: Response): Promise<T | null> {
  const text = await response.text().catch(() => "");

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export default function PromoCodeSection({
  category,
  subtotal,
  currency,
  disabled,
  onPromoChange,
}: {
  category: string;
  subtotal: number;
  currency: string;
  disabled: boolean;
  onPromoChange: (promoCode: AppliedPromoCode | null) => void;
}) {
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromoCode | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [availablePromos, setAvailablePromos] = useState<StorefrontPromoCode[]>([]);
  const [applyingCode, setApplyingCode] = useState("");

  const commitPromoChange = useCallback(
    (promoCode: AppliedPromoCode | null) => {
      setAppliedPromo(promoCode);
      onPromoChange(promoCode);
    },
    [onPromoChange]
  );

  useEffect(() => {
    if (!disabled) {
      return;
    }

    setPromoInput("");
    commitPromoChange(null);
    setFeedback(null);
  }, [commitPromoChange, disabled]);

  useEffect(() => {
    if (disabled || subtotal <= 0 || !appliedPromo?.code) {
      return;
    }

    let isActive = true;

    const revalidatePromo = async () => {
      const response = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: appliedPromo.code,
          category,
          subtotal,
        }),
      });
      const payload = await parseJson<PromoValidationResponse>(response);

      if (!isActive) {
        return;
      }

      if (!response.ok || !payload?.promoCode) {
        commitPromoChange(null);
        setFeedback({
          tone: "info",
          message: getResponseMessage(
            payload,
            "Promo dilepas karena sudah tidak cocok dengan nominal saat ini."
          ),
        });
        return;
      }

      commitPromoChange(payload.promoCode);
      setPromoInput(payload.promoCode.code);
    };

    void revalidatePromo();

    return () => {
      isActive = false;
    };
  }, [appliedPromo?.code, category, commitPromoChange, disabled, subtotal]);

  const applyPromoCode = async (code: string) => {
    const normalizedCode = String(code || "").trim().toUpperCase();

    if (!normalizedCode) {
      setFeedback({
        tone: "error",
        message: "Masukkan kode promo terlebih dahulu.",
      });
      return;
    }

    if (disabled || subtotal <= 0) {
      setFeedback({
        tone: "error",
        message: "Pilih nominal terlebih dahulu sebelum memakai promo.",
      });
      return;
    }

    try {
      setApplyingCode(normalizedCode);
      setFeedback(null);

      const response = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: normalizedCode,
          category,
          subtotal,
        }),
      });
      const payload = await parseJson<PromoValidationResponse>(response);

      if (!response.ok || !payload?.promoCode) {
        throw new Error(
          getResponseMessage(payload, "Kode promo tidak dapat digunakan")
        );
      }

      commitPromoChange(payload.promoCode);
      setPromoInput(payload.promoCode.code);
      setDialogOpen(false);
      setFeedback({
        tone: "success",
        message:
          payload.message ||
          `Promo berhasil dipakai. Diskon ${formatCurrency(
            payload.promoCode.discountAmount || 0,
            currency
          )}`,
      });
    } catch (error) {
      commitPromoChange(null);
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Kode promo tidak dapat digunakan",
      });
    } finally {
      setApplyingCode("");
    }
  };

  const loadAvailablePromos = async () => {
    try {
      setDialogLoading(true);
      const params = new URLSearchParams({
        category,
        subtotal: String(subtotal || 0),
      });
      const response = await fetch(`/api/promo-codes/public?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = await parseJson<{ items?: StorefrontPromoCode[] }>(response);

      if (!response.ok) {
        throw new Error(
          getResponseMessage(payload, "Gagal memuat promo yang tersedia")
        );
      }

      const items = Array.isArray(payload?.items) ? payload.items : [];
      setAvailablePromos(items);
      return items;
    } catch (error) {
      setAvailablePromos([]);
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Gagal memuat promo yang tersedia",
      });
      return [];
    } finally {
      setDialogLoading(false);
    }
  };

  const handleOpenDialog = async () => {
    if (disabled || subtotal <= 0) {
      setFeedback({
        tone: "info",
        message:
          "Promo belum tersedia. Pilih nominal terlebih dahulu lalu coba lagi.",
      });
      return;
    }

    setFeedback(null);
    const items = await loadAvailablePromos();

    if (items.length === 0) {
      setDialogOpen(false);
      setFeedback({
        tone: "info",
        message: "Promo belum tersedia saat ini.",
      });
      return;
    }

    setDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-[18px] border border-white/8 bg-[#313237] p-3 shadow-[0_12px_24px_rgba(0,0,0,0.12)] sm:bg-transparent sm:p-0 sm:shadow-none">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={promoInput}
              onChange={(event) => {
                setPromoInput(event.target.value.toUpperCase());
                setFeedback(null);
              }}
              placeholder="Ketik Kode Promo Kamu"
              disabled={disabled}
              className="h-11 flex-1 rounded-[14px] border border-white/8 bg-[#3a3b40] px-3.5 text-[15px] uppercase tracking-[0.08em] text-white outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-white/28 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-[42px] sm:text-[13px]"
            />

            <button
              type="button"
              onClick={() => void applyPromoCode(promoInput)}
              disabled={disabled || !promoInput.trim() || Boolean(applyingCode)}
              className="inline-flex h-11 w-full items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,var(--accent-strong)_0%,var(--accent)_100%)] px-5 text-[13px] font-semibold text-white shadow-[0_14px_28px_var(--accent-glow)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:h-[42px] sm:w-auto sm:min-w-[116px]"
            >
              {applyingCode ? "Memeriksa..." : "Gunakan"}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleOpenDialog()}
          className="inline-flex h-11 w-full items-center justify-center rounded-[14px] border border-[rgba(211,59,59,0.28)] bg-[rgba(211,59,59,0.16)] px-4 text-[13px] font-semibold text-white transition hover:border-[rgba(211,59,59,0.45)] hover:bg-[rgba(211,59,59,0.22)] sm:h-[42px] sm:w-auto"
        >
          {dialogLoading ? "Memuat Promo..." : "Pakai Promo Yang Tersedia"}
        </button>

        {appliedPromo ? (
          <div className="rounded-[16px] border border-[rgba(211,59,59,0.28)] bg-[rgba(211,59,59,0.12)] px-4 py-4 text-sm text-white">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-soft)]">
                  Promo Aktif
                </p>
                <p className="mt-2 text-base font-semibold text-white">
                  {appliedPromo.title || appliedPromo.code}
                </p>
                <p className="mt-1 text-sm text-white/72">
                  Kode {appliedPromo.code} memberi potongan{" "}
                  <span className="font-semibold text-white">
                    {formatCurrency(appliedPromo.discountAmount || 0, currency)}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  commitPromoChange(null);
                  setPromoInput("");
                  setFeedback({
                    tone: "info",
                    message: "Promo telah dilepas dari transaksi ini.",
                  });
                }}
                className="inline-flex h-10 items-center justify-center rounded-full border border-white/12 px-4 text-xs font-semibold text-white/76 transition hover:border-[rgba(211,59,59,0.45)] hover:text-white"
              >
                Hapus Promo
              </button>
            </div>
          </div>
        ) : null}

        {feedback ? (
          <div
            className={`rounded-[16px] border px-4 py-3 text-[13px] leading-6 ${getFeedbackClasses(
              feedback.tone
            )}`}
          >
            {feedback.message}
          </div>
        ) : null}
      </div>

      <PromoCodeDialog
        open={dialogOpen}
        loading={dialogLoading}
        promoCodes={availablePromos}
        currency={currency}
        onApply={(code) => void applyPromoCode(code)}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
