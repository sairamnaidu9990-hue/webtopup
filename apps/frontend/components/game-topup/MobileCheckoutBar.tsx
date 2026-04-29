"use client";

import Image from "next/image";

import { formatCurrency } from "@/components/game-topup/helpers";
import type { StorefrontVariant } from "@/lib/siteData";
import type { AppliedPromoCode } from "@/components/PromoCodeSection";

export default function MobileCheckoutBar({
  selectedVariant,
  createdOrder,
  totalPayment,
  baseSubtotal,
  paymentFee,
  appliedPromo,
  promoDiscount,
  isMobileSummaryExpanded,
  onToggleExpanded,
  onOrderClick,
  isCreatingOrder,
}: {
  selectedVariant: StorefrontVariant | null;
  createdOrder: {
    invoiceNumber: string;
    totalAmount: number;
    currency: string;
  } | null;
  totalPayment: number;
  baseSubtotal: number;
  paymentFee: number;
  appliedPromo: AppliedPromoCode | null;
  promoDiscount: number;
  isMobileSummaryExpanded: boolean;
  onToggleExpanded: () => void;
  onOrderClick: () => void;
  isCreatingOrder: boolean;
}) {
  return (
    <div className="site-shell space-y-3 pt-3">
      {createdOrder ? (
        <div className="rounded-[14px] border border-emerald-400/20 bg-emerald-500/10 px-3.5 py-3 text-[12px] text-emerald-100">
          <p className="font-semibold text-white">Draft order berhasil dibuat</p>
          <p className="mt-1">
            Invoice:{" "}
            <span className="font-semibold text-white">
              {createdOrder.invoiceNumber}
            </span>
          </p>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[18px] border border-white/8 bg-[#2a2a2f] shadow-[0_12px_24px_rgba(0,0,0,0.14)]">
        {selectedVariant ? (
          <button
            type="button"
            onClick={onToggleExpanded}
            className="block w-full p-3.5 text-left"
          >
            <div className="flex items-start gap-3">
              <div className="overflow-hidden rounded-[12px] border border-white/8 bg-[#34353b]">
                {selectedVariant.logo ? (
                  <Image
                    src={selectedVariant.logo}
                    alt={selectedVariant.name}
                    width={46}
                    height={46}
                    sizes="46px"
                    className="h-[46px] w-[46px] object-cover object-center"
                  />
                ) : (
                  <div className="flex h-[46px] w-[46px] items-center justify-center bg-[#34353b] text-base text-white/78">
                    ◆
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-[13px] font-semibold text-white">
                      {selectedVariant.name}
                    </p>
                    <p className="mt-1 text-[15px] font-bold leading-none text-[var(--accent-strong)]">
                      {formatCurrency(totalPayment, selectedVariant.currency)}
                    </p>
                  </div>

                  <span className="text-sm text-white/54">
                    {isMobileSummaryExpanded ? "▴" : "▾"}
                  </span>
                </div>

                {isMobileSummaryExpanded ? (
                  <div className="mt-3 space-y-2 border-t border-white/8 pt-3 text-[12px] text-white/78">
                    <div className="flex items-center justify-between gap-3">
                      <span>Harga</span>
                      <span className="font-medium text-white">
                        {formatCurrency(baseSubtotal, selectedVariant.currency)}
                      </span>
                    </div>

                    {appliedPromo ? (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <span>Kode Promo</span>
                          <span className="font-medium text-white">
                            {appliedPromo.code}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <span>Diskon Promo</span>
                          <span className="font-medium text-[var(--accent-soft)]">
                            -{formatCurrency(
                              promoDiscount,
                              selectedVariant.currency
                            )}
                          </span>
                        </div>
                      </>
                    ) : null}

                    <div className="flex items-center justify-between gap-3">
                      <span>Biaya</span>
                      <span className="font-medium text-white">
                        {formatCurrency(paymentFee, selectedVariant.currency)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-white">
                        Total Pembayaran
                      </span>
                      <span className="text-[14px] font-bold leading-none text-[var(--accent-strong)]">
                        {formatCurrency(totalPayment, selectedVariant.currency)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </button>
        ) : (
          <div className="px-4 py-4 text-center text-[13px] text-white/58">
            Belum ada product yang dipilih.
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={onOrderClick}
        disabled={isCreatingOrder}
        className="flex h-12 w-full items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,var(--accent-strong)_0%,var(--accent)_100%)] px-4 text-[14px] font-semibold text-white shadow-[0_14px_28px_var(--accent-glow)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCreatingOrder ? "Membuat Order..." : "Pesan Sekarang"}
      </button>
    </div>
  );
}
