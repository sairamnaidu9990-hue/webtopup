import Link from "next/link";

import type { CustomerOrder } from "./types";
import { formatCurrency, formatDate, getStatusTone } from "./utils";

function OrdersSkeleton() {
  return (
    <div className="mt-5 space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-4"
        >
          <div className="animate-pulse space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-5 w-36 rounded-xl bg-white/10" />
              <div className="h-5 w-16 rounded-full bg-white/10" />
              <div className="h-5 w-24 rounded-full bg-white/10" />
            </div>
            <div className="h-4 w-48 rounded-xl bg-white/10" />
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="h-16 rounded-2xl bg-white/[0.06]" />
              <div className="h-16 rounded-2xl bg-white/[0.06]" />
              <div className="h-16 rounded-2xl bg-white/[0.06]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CustomerOrdersSection({
  orders,
  ordersLoading,
}: {
  orders: CustomerOrder[];
  ordersLoading: boolean;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Riwayat Transaksi</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Riwayat ini otomatis mengambil order yang dibuat saat kamu login di
            KITAGG, termasuk invoice topup saldo.
          </p>
        </div>
        <Link
          href="/cek-transaksi"
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 px-4 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white"
        >
          Cek transaksi umum
        </Link>
      </div>

      {ordersLoading ? (
        <OrdersSkeleton />
      ) : orders.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/55">
          Belum ada transaksi yang tercatat di akun ini.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {orders.map((order) => (
            <Link
              key={order._id}
              href={`/invoice/${order.invoiceNumber}`}
              className="block rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:border-red-400/25 hover:bg-white/[0.05]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">
                      {order.orderType === "BALANCE_TOPUP"
                        ? "Top Up Saldo KITAGG"
                        : order.gameSnapshot?.name || "-"}
                    </p>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70">
                      {order.orderType === "BALANCE_TOPUP"
                        ? "Saldo"
                        : `${Math.max(Number(order.quantity || 1), 1)}x`}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusTone(
                        order.status
                      )}`}
                    >
                      {order.status || "UNPAID"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/65">
                    {order.orderType === "BALANCE_TOPUP"
                      ? order.variantSnapshot?.name || "Topup saldo"
                      : order.variantSnapshot?.name || "-"}
                  </p>
                  <p className="mt-2 text-xs text-white/42">
                    Invoice {order.invoiceNumber} • {formatDate(order.createdAt)}
                  </p>
                  {order.providerMessage?.trim() || order.notes?.trim() ? (
                    <p className="mt-3 text-xs leading-6 text-amber-100/85">
                      {order.providerMessage?.trim() || order.notes?.trim()}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2 text-sm text-white/70 sm:grid-cols-3 lg:min-w-[320px]">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                      Total
                    </p>
                    <p className="mt-2 font-semibold text-white">
                      {formatCurrency(
                        Number(order.price?.totalAmount || order.price?.sellPrice || 0),
                        order.price?.currency || "IDR"
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                      Payment
                    </p>
                    <p className="mt-2 font-semibold text-white">
                      {order.paymentStatus || "UNPAID"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                      Metode
                    </p>
                    <p className="mt-2 font-semibold text-white">
                      {order.paymentMethodName || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
