"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCustomerSession } from "./CustomerSessionProvider";

type CustomerOrder = {
  _id: string;
  invoiceNumber: string;
  status: string;
  paymentStatus: string;
  providerStatus: string;
  quantity: number;
  gameSnapshot?: {
    name?: string;
  };
  variantSnapshot?: {
    name?: string;
  };
  paymentMethodName?: string;
  price?: {
    currency?: string;
    totalAmount?: number;
  };
  createdAt?: string | null;
};

function formatCurrency(currency = "IDR", value = 0) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function CustomerDashboardPageClient() {
  const { customer, loading, logout } = useCustomerSession();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      if (!customer?.id) {
        setOrders([]);
        return;
      }

      try {
        setOrdersLoading(true);
        setError("");

        const response = await fetch("/api/customer-orders/me?limit=50", {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message || "Gagal mengambil riwayat transaksi");
        }

        if (active) {
          setOrders(Array.isArray(payload?.items) ? payload.items : []);
        }
      } catch (ordersError) {
        if (active) {
          setError(
            ordersError instanceof Error
              ? ordersError.message
              : "Gagal mengambil riwayat transaksi"
          );
        }
      } finally {
        if (active) {
          setOrdersLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      active = false;
    };
  }, [customer?.id]);

  const stats = useMemo(
    () => ({
      totalOrders: orders.length,
      successOrders: orders.filter((item) => item.status === "SUCCESS").length,
    }),
    [orders]
  );

  if (loading) {
    return (
      <main className="site-shell py-10 sm:py-14">
        <div className="rounded-[32px] border border-white/10 bg-[#191b22] p-6 text-white shadow-[0_26px_70px_rgba(0,0,0,0.32)]">
          Memuat dashboard akun...
        </div>
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="site-shell py-10 sm:py-14">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-white/10 bg-[#191b22] p-6 text-white shadow-[0_26px_70px_rgba(0,0,0,0.32)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300">
            Dashboard User
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Masuk dulu untuk melihat akunmu</h1>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Guest tetap bisa membeli dan cek transaksi tanpa login. Tapi dashboard
            user hanya tersedia untuk akun yang sudah daftar dan login.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/masuk"
              className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(211,59,59,0.22)]"
            >
              Masuk
            </Link>
            <Link
              href="/daftar"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/90"
            >
              Daftar akun baru
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="site-shell py-10 sm:py-14">
      <div className="space-y-6">
        <div className="rounded-[32px] border border-white/10 bg-[#191b22] p-6 text-white shadow-[0_26px_70px_rgba(0,0,0,0.32)] sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300">
                Dashboard User
              </p>
              <h1 className="mt-3 text-3xl font-semibold">{customer.name}</h1>
              <p className="mt-2 text-sm text-white/55">@{customer.username}</p>
            </div>

            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 px-5 text-sm font-semibold text-white/90 transition hover:bg-white/5"
            >
              Logout
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">Email</p>
              <p className="mt-2 text-sm font-medium text-white">{customer.email}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">No HP</p>
              <p className="mt-2 text-sm font-medium text-white">
                {customer.phoneCountryCode} {customer.phoneNumber}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">Saldo KITAGG</p>
              <p className="mt-2 text-lg font-semibold text-red-300">
                {formatCurrency("IDR", customer.balance)}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">Transaksi Berhasil</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {stats.successOrders} / {stats.totalOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-[#191b22] p-6 text-white shadow-[0_26px_70px_rgba(0,0,0,0.32)] sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Riwayat Transaksi</h2>
              <p className="mt-1 text-sm text-white/55">
                Semua transaksi yang dibuat saat kamu login akan muncul di sini.
              </p>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {ordersLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/60">
              Memuat riwayat transaksi...
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/60">
              Belum ada transaksi yang terhubung ke akun ini.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order._id}
                  href={`/invoice/${order.invoiceNumber}`}
                  className="block rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/[0.08]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">
                          {order.gameSnapshot?.name || "Game"}
                        </p>
                        <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/70">
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white/60">
                        {order.variantSnapshot?.name || "-"} x{order.quantity}
                      </p>
                      <p className="mt-1 text-xs text-white/45">
                        Invoice {order.invoiceNumber} • {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-left lg:text-right">
                      <p className="text-sm font-semibold text-red-300">
                        {formatCurrency(
                          order.price?.currency || "IDR",
                          order.price?.totalAmount || 0
                        )}
                      </p>
                      <p className="mt-1 text-xs text-white/45">
                        {order.paymentMethodName || "Metode pembayaran"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
