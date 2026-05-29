"use client";

import { useMemo, useState } from "react";
import type {
  StorefrontCustomerPointTransaction,
  StorefrontCustomerRewardSummary,
} from "@/lib/siteData";

import { formatDate } from "./utils";

function getPointTransactionLabel(transaction: StorefrontCustomerPointTransaction) {
  const source = String(transaction.source || "").toUpperCase();

  if (source === "ORDER_REWARD") {
    return "Poin dari Order Berhasil";
  }

  if (source === "LOYALTY_REDEEM_BALANCE") {
    return "Tukar Poin ke Saldo";
  }

  if (source === "LOYALTY_REDEEM_PROMO") {
    return "Tukar Poin ke Promo";
  }

  return transaction.type === "CREDIT" ? "Poin Masuk" : "Poin Keluar";
}

function getPointTransactionTone(transaction: StorefrontCustomerPointTransaction) {
  return transaction.type === "CREDIT"
    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
    : "border-red-400/20 bg-red-500/10 text-red-100";
}

function RewardsSkeleton() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-56 rounded-2xl bg-white/10" />
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <div className="h-28 rounded-3xl bg-white/[0.05]" />
            <div className="h-36 rounded-3xl bg-white/[0.05]" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 rounded-3xl bg-white/[0.05]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerRewardsSection({
  summary,
  pointTransactions,
  loading,
  redeemBalancePoints,
  redeemPromoPoints,
  redeemSubmitting,
  onRedeemBalancePointsChange,
  onRedeemPromoPointsChange,
  onRedeemBalance,
  onRedeemPromo,
}: {
  summary: StorefrontCustomerRewardSummary | null;
  pointTransactions: StorefrontCustomerPointTransaction[];
  loading: boolean;
  redeemBalancePoints: string;
  redeemPromoPoints: string;
  redeemSubmitting: "balance" | "promo" | null;
  onRedeemBalancePointsChange: (value: string) => void;
  onRedeemPromoPointsChange: (value: string) => void;
  onRedeemBalance: () => void;
  onRedeemPromo: () => void;
}) {
  const [copyFeedback, setCopyFeedback] = useState("");
  const minimumRedeemPoints = Number(summary?.minimumRedeemPoints || 100);
  const redeemValuePerPoint = Number(summary?.loyaltyRedeemValuePerPoint || 10);
  const recentTransactions = useMemo(
    () => pointTransactions.slice(0, 6),
    [pointTransactions]
  );

  if (loading) {
    return <RewardsSkeleton />;
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Referral & Loyalty Member</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Bagikan kode referral kamu, kumpulkan poin dari order berhasil, lalu
            tukar menjadi saldo KITAGG atau promo personal.
          </p>
        </div>
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-100/60">
            Loyalty Point
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {Number(summary?.loyaltyPoints || 0).toLocaleString("id-ID")} poin
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                  Kode Referral Kamu
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-[0.16em] text-white">
                  {summary?.referralCode || "-"}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  User baru yang daftar dengan kode ini dan menyelesaikan order
                  pertama akan membuka bonus saldo referral.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!summary?.referralCode) {
                    return;
                  }

                  await navigator.clipboard.writeText(summary.referralCode);
                  setCopyFeedback("Kode referral disalin.");
                  window.setTimeout(() => setCopyFeedback(""), 2200);
                }}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 px-4 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white"
              >
                Salin Kode
              </button>
            </div>

            {copyFeedback ? (
              <p className="mt-3 text-sm text-emerald-100">{copyFeedback}</p>
            ) : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Referral Aktif
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {Number(summary?.referredCustomersCount || 0).toLocaleString("id-ID")}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Referral Dari
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {summary?.referredBy?.username
                    ? `@${summary.referredBy.username}`
                    : "Belum ada"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm font-semibold text-white">Tukar Poin ke Saldo</p>
              <p className="mt-2 text-sm leading-6 text-white/58">
                1 poin = Rp{redeemValuePerPoint.toLocaleString("id-ID")}. Minimal
                tukar {minimumRedeemPoints.toLocaleString("id-ID")} poin.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <input
                  type="number"
                  min={minimumRedeemPoints}
                  inputMode="numeric"
                  value={redeemBalancePoints}
                  onChange={(event) => onRedeemBalancePointsChange(event.target.value)}
                  placeholder={`Contoh ${minimumRedeemPoints}`}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-red-400/40 focus:bg-white/[0.08]"
                />
                <button
                  type="button"
                  onClick={onRedeemBalance}
                  disabled={redeemSubmitting === "balance"}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(211,59,59,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {redeemSubmitting === "balance" ? "Memproses..." : "Tukar ke Saldo"}
                </button>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm font-semibold text-white">Tukar Poin ke Promo</p>
              <p className="mt-2 text-sm leading-6 text-white/58">
                Poin akan diubah menjadi promo personal milik akun kamu dengan
                nominal diskon setara nilai tukarnya.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <input
                  type="number"
                  min={minimumRedeemPoints}
                  inputMode="numeric"
                  value={redeemPromoPoints}
                  onChange={(event) => onRedeemPromoPointsChange(event.target.value)}
                  placeholder={`Contoh ${minimumRedeemPoints}`}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-red-400/40 focus:bg-white/[0.08]"
                />
                <button
                  type="button"
                  onClick={onRedeemPromo}
                  disabled={redeemSubmitting === "promo"}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 px-4 text-sm font-semibold text-white/85 transition hover:border-red-400/35 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {redeemSubmitting === "promo" ? "Membuat Promo..." : "Tukar ke Promo"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Histori Poin Member</p>
              <p className="mt-2 text-sm leading-6 text-white/58">
                Semua poin masuk dan keluar tercatat otomatis di sini.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                Total Histori
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {pointTransactions.length}
              </p>
            </div>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/55">
              Belum ada mutasi poin pada akun ini.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPointTransactionTone(
                          transaction
                        )}`}
                      >
                        {getPointTransactionLabel(transaction)}
                      </span>
                      {transaction.invoiceNumber ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/68">
                          {transaction.invoiceNumber}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm font-medium text-white">
                      {transaction.description || getPointTransactionLabel(transaction)}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                          Poin
                        </p>
                        <p className="mt-2 font-semibold text-white">
                          {transaction.type === "DEBIT" ? "-" : "+"}
                          {Number(transaction.points || 0).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                          Saldo Poin
                        </p>
                        <p className="mt-2 font-semibold text-white">
                          {Number(transaction.pointsAfter || 0).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-white/42">{formatDate(transaction.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
