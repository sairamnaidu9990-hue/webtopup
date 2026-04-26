"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { StorefrontPromoCode } from "@/lib/siteData";

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

function formatDiscountLabel(promoCode: StorefrontPromoCode, currency: string) {
  if (promoCode.discountType === "percent") {
    return `Diskon ${Number(promoCode.discountValue || 0).toFixed(2)}%`;
  }

  return `Diskon ${formatCurrency(promoCode.discountValue || 0, currency)}`;
}

export default function PromoCodeDialog({
  open,
  loading,
  promoCodes,
  currency,
  onApply,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  promoCodes: StorefrontPromoCode[];
  currency: string;
  onApply: (code: string) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[92] flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-[#171a21] text-white shadow-[0_32px_90px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-soft)]">
              Promo Storefront
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              Promo yang tersedia
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup daftar promo"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/30 text-xl text-white transition hover:border-[#d33b3b] hover:bg-black/45"
          >
            ×
          </button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
          {loading ? (
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-5 text-sm text-white/68">
              Memuat promo yang tersedia...
            </div>
          ) : promoCodes.length > 0 ? (
            promoCodes.map((promoCode) => {
              const isAvailable = promoCode.isAvailable;
              const isUnlimited = Number(promoCode.maxDailyUses || 0) <= 0;

              return (
                <article
                  key={promoCode._id}
                  className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4 shadow-[0_12px_24px_rgba(0,0,0,0.16)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-[var(--accent-soft)]">
                        {formatDiscountLabel(promoCode, currency)}
                      </h3>
                      {promoCode.description ? (
                        <p className="mt-2 text-sm leading-6 text-white/72">
                          {promoCode.description}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        isAvailable
                          ? "bg-emerald-500/20 text-emerald-100"
                          : "bg-[rgba(211,59,59,0.18)] text-[#ffb2b2]"
                      }`}
                    >
                      {isAvailable ? "Tersedia" : "Tidak Tersedia"}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-2 text-[13px] leading-6 text-white/72">
                    <li>
                      Minimal pembelian{" "}
                      <span className="font-semibold text-white">
                        {formatCurrency(promoCode.minimumOrderAmount || 0, currency)}
                      </span>
                    </li>
                    <li>
                      Batas penggunaan harian{" "}
                      <span className="font-semibold text-white">
                        {isUnlimited
                          ? "tanpa batas"
                          : `${promoCode.dailyUsageCount || 0}/${promoCode.maxDailyUses}`}
                      </span>
                    </li>
                    <li>
                      Kategori{" "}
                      <span className="font-semibold text-white">
                        {promoCode.applicableCategories.length > 0
                          ? promoCode.applicableCategories.join(", ")
                          : "semua kategori"}
                      </span>
                    </li>
                    {promoCode.availabilityReason ? (
                      <li className="text-[#ffb2b2]">
                        {promoCode.availabilityReason}
                      </li>
                    ) : null}
                  </ul>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                      Kode Promo: {promoCode.code}
                    </p>

                    <button
                      type="button"
                      onClick={() => onApply(promoCode.code)}
                      disabled={!isAvailable}
                      className="inline-flex h-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-4 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/36"
                    >
                      Gunakan
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-5 text-sm text-white/68">
              Belum ada promo yang tersedia untuk kategori dan nominal ini.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
