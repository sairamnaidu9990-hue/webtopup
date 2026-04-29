"use client";

import Image from "next/image";

import GameReviewSection from "@/components/GameReviewSection";
import { formatCurrency } from "@/components/game-topup/helpers";
import type {
  StorefrontGame,
  StorefrontGameReviewSummary,
  StorefrontPaymentMethod,
  StorefrontVariant,
} from "@/lib/siteData";
import type { AppliedPromoCode } from "@/components/PromoCodeSection";

export default function DesktopCheckoutSidebar({
  game,
  reviewSummary,
  selectedVariant,
  createdOrder,
  baseSubtotal,
  appliedPromo,
  promoDiscount,
  paymentFee,
  selectedPaymentMethod,
  totalPayment,
  isCreatingOrder,
  onOrderClick,
}: {
  game: StorefrontGame;
  reviewSummary: StorefrontGameReviewSummary;
  selectedVariant: StorefrontVariant | null;
  createdOrder: {
    invoiceNumber: string;
    totalAmount: number;
    currency: string;
  } | null;
  baseSubtotal: number;
  appliedPromo: AppliedPromoCode | null;
  promoDiscount: number;
  paymentFee: number;
  selectedPaymentMethod: StorefrontPaymentMethod | null;
  totalPayment: number;
  isCreatingOrder: boolean;
  onOrderClick: () => void;
}) {
  return (
    <div className="hidden space-y-3 md:block xl:sticky xl:top-[104px] xl:self-start">
      <GameReviewSection gameName={game.name} summary={reviewSummary} compact />

      <section className="overflow-hidden rounded-[18px] border border-white/8 bg-[#2a2a2f] shadow-[0_12px_24px_rgba(0,0,0,0.14)]">
        {selectedVariant ? (
          <div className="space-y-4 p-4 sm:p-[18px]">
            {createdOrder ? (
              <div className="rounded-[14px] border border-emerald-400/20 bg-emerald-500/10 px-3.5 py-3 text-[12px] text-emerald-100">
                <p className="font-semibold text-white">
                  Draft order berhasil dibuat
                </p>
                <p className="mt-1">
                  Invoice:{" "}
                  <span className="font-semibold text-white">
                    {createdOrder.invoiceNumber}
                  </span>
                </p>
              </div>
            ) : null}

            <div className="flex items-start gap-3">
              <div className="overflow-hidden rounded-[14px] border border-white/8 bg-[#34353b]">
                {selectedVariant.logo ? (
                  <Image
                    src={selectedVariant.logo}
                    alt={selectedVariant.name}
                    width={58}
                    height={58}
                    sizes="58px"
                    className="h-[58px] w-[58px] object-cover object-center"
                  />
                ) : (
                  <div className="flex h-[58px] w-[58px] items-center justify-center bg-[#34353b] text-xl text-white/78">
                    ◆
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[14px] font-semibold leading-5 text-white">
                  {game.name}
                </p>
                <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-white/75">
                  {selectedVariant.name}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-[13px] text-white/84">
              <div className="flex items-center justify-between gap-4">
                <span>Harga</span>
                <span className="font-medium text-white">
                  {formatCurrency(baseSubtotal, selectedVariant.currency)}
                </span>
              </div>

              {appliedPromo ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span>Kode Promo</span>
                    <span className="font-medium text-white">
                      {appliedPromo.code}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span>Diskon Promo</span>
                    <span className="font-medium text-[var(--accent-soft)]">
                      -{formatCurrency(promoDiscount, selectedVariant.currency)}
                    </span>
                  </div>
                </>
              ) : null}

              <div className="flex items-center justify-between gap-4">
                <span>Jumlah Pembelian</span>
                <span className="font-medium text-white">1</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span>Biaya</span>
                <span className="font-medium text-white">
                  {formatCurrency(paymentFee, selectedVariant.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span>Pembayaran</span>
                <span className="font-medium text-white">
                  {selectedPaymentMethod?.name || "-"}
                </span>
              </div>
            </div>

            <div className="border-t border-white/8 pt-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[15px] font-semibold text-white">
                  Total Pembayaran
                </span>
                <span className="text-[1.2rem] font-bold leading-none text-[var(--accent-strong)]">
                  {formatCurrency(totalPayment, selectedVariant.currency)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[16px] border border-dashed border-white/10 bg-[#242429] px-4 py-5 text-[13px] text-white/58">
            Belum ada product yang dipilih.
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={onOrderClick}
        disabled={isCreatingOrder}
        className="flex h-12 w-full items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,var(--accent-strong)_0%,var(--accent)_100%)] px-4 text-[14px] font-semibold text-white shadow-[0_14px_28px_var(--accent-glow)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCreatingOrder ? "Membuat Order..." : "Pesan Sekarang"}
      </button>
    </div>
  );
}
