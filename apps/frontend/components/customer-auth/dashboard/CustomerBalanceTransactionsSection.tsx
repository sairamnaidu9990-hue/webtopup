import type { StorefrontBalanceTransaction } from "@/lib/siteData";

import {
  formatCurrency,
  formatDate,
  getTransactionLabel,
  getTransactionTone,
} from "./utils";

function TransactionsSkeleton() {
  return (
    <div className="mt-5 space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-4"
        >
          <div className="animate-pulse space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-5 w-28 rounded-full bg-white/10" />
              <div className="h-5 w-24 rounded-full bg-white/10" />
            </div>
            <div className="h-4 w-2/3 rounded-xl bg-white/10" />
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="h-16 rounded-2xl bg-white/[0.06]" />
              <div className="h-16 rounded-2xl bg-white/[0.06]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CustomerBalanceTransactionsSection({
  balanceTransactions,
  balanceLoading,
}: {
  balanceTransactions: StorefrontBalanceTransaction[];
  balanceLoading: boolean;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Mutasi Saldo</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Semua saldo masuk dan keluar akan tercatat di sini.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Total Mutasi
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {balanceTransactions.length}
          </p>
        </div>
      </div>

      {balanceLoading ? (
        <TransactionsSkeleton />
      ) : balanceTransactions.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/55">
          Belum ada mutasi saldo pada akun ini.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {balanceTransactions.slice(0, 8).map((transaction) => (
            <div
              key={transaction.id}
              className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getTransactionTone(
                        transaction
                      )}`}
                    >
                      {getTransactionLabel(transaction)}
                    </span>
                    {transaction.invoiceNumber ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/68">
                        {transaction.invoiceNumber}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm font-medium text-white">
                    {transaction.description || getTransactionLabel(transaction)}
                  </p>
                  <p className="mt-2 text-xs text-white/42">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>

                <div className="grid gap-2 text-sm text-white/70 sm:min-w-[240px] sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                      Nominal
                    </p>
                    <p className="mt-2 font-semibold text-white">
                      {transaction.type === "DEBIT" ? "-" : "+"}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                      Saldo Akhir
                    </p>
                    <p className="mt-2 font-semibold text-white">
                      {formatCurrency(transaction.balanceAfter, transaction.currency)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
