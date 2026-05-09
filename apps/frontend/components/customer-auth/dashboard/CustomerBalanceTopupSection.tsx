import Image from "next/image";

import type { StorefrontPaymentMethod } from "@/lib/siteData";

import { MAX_TOPUP_AMOUNT, MIN_TOPUP_AMOUNT, formatCurrency } from "./utils";

function getPaymentMethodMeta(paymentMethod: StorefrontPaymentMethod) {
  const categoryName = String(paymentMethod.category?.name || "").trim();
  const type = String(paymentMethod.type || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return categoryName || type || "Metode Pembayaran";
}

export default function CustomerBalanceTopupSection({
  balance,
  balanceLogoUrl,
  topupAmount,
  topupPaymentMethodCode,
  paymentMethods,
  paymentMethodsLoading,
  topupSubmitting,
  onTopupAmountChange,
  onTopupPaymentMethodChange,
  onSubmit,
}: {
  balance: number;
  balanceLogoUrl: string;
  topupAmount: string;
  topupPaymentMethodCode: string;
  paymentMethods: StorefrontPaymentMethod[];
  paymentMethodsLoading: boolean;
  topupSubmitting: boolean;
  onTopupAmountChange: (value: string) => void;
  onTopupPaymentMethodChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {balanceLogoUrl ? (
              <div className="overflow-hidden rounded-xl border border-white/10 bg-white p-1 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                <Image
                  src={balanceLogoUrl}
                  alt="Logo Saldo KITAGG"
                  width={40}
                  height={40}
                  sizes="40px"
                  className="h-10 w-10 object-contain"
                />
              </div>
            ) : null}
            <h2 className="text-xl font-semibold text-white">Topup Saldo KITAGG</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Isi saldo pakai metode pembayaran aktif, lalu kamu bisa bayar checkout
            game langsung dari saldo KITAGG.
          </p>
        </div>
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-100/60">
            Saldo Saat Ini
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-white/84">Nominal Topup</span>
          <input
            type="number"
            min={MIN_TOPUP_AMOUNT}
            max={MAX_TOPUP_AMOUNT}
            inputMode="numeric"
            value={topupAmount}
            onChange={(event) => onTopupAmountChange(event.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]"
            placeholder={`Minimal ${MIN_TOPUP_AMOUNT.toLocaleString("id-ID")}`}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-white/84">Metode Pembayaran</span>
          {paymentMethodsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[92px] animate-pulse rounded-[24px] border border-white/8 bg-white/[0.04]"
                />
              ))}
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/58">
              Belum ada metode pembayaran aktif.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {paymentMethods.map((paymentMethod) => {
                const isSelected =
                  paymentMethod.code === topupPaymentMethodCode;

                return (
                  <button
                    key={paymentMethod.code}
                    type="button"
                    onClick={() => onTopupPaymentMethodChange(paymentMethod.code)}
                    className={`group relative overflow-hidden rounded-[24px] border p-4 text-left transition ${
                      isSelected
                        ? "border-red-400/45 bg-[linear-gradient(135deg,rgba(210,53,53,0.16)_0%,rgba(255,255,255,0.04)_100%)] shadow-[0_18px_34px_rgba(211,59,59,0.16)]"
                        : "border-white/10 bg-white/[0.04] hover:border-red-400/25 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,245,245,0.92)_100%)] shadow-[0_12px_24px_rgba(0,0,0,0.16)]">
                        {paymentMethod.logo ? (
                          <Image
                            src={paymentMethod.logo}
                            alt={paymentMethod.name}
                            width={48}
                            height={48}
                            sizes="56px"
                            className="h-10 w-10 object-contain"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-slate-800">
                            {paymentMethod.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {paymentMethod.name}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/42">
                              {getPaymentMethodMeta(paymentMethod)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                              isSelected
                                ? "border-red-300/30 bg-red-400/12 text-red-100"
                                : "border-white/10 bg-white/[0.05] text-white/55"
                            }`}
                          >
                            {isSelected ? "Dipilih" : "Tersedia"}
                          </span>
                        </div>

                        <p className="mt-4 text-sm text-white/72">
                          Pembayaran otomatis
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </label>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/58">
          Topup saldo minimal Rp{MIN_TOPUP_AMOUNT.toLocaleString("id-ID")} dan
          maksimal Rp{MAX_TOPUP_AMOUNT.toLocaleString("id-ID")} per invoice.
        </div>

        <button
          type="submit"
          disabled={topupSubmitting || paymentMethodsLoading || paymentMethods.length === 0}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(211,59,59,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {topupSubmitting ? "Membuat Invoice Topup..." : "Buat Invoice Topup"}
        </button>
      </form>
    </div>
  );
}
