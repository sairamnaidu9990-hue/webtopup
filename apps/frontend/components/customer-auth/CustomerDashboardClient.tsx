"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCustomerSession } from "@/components/customer-auth/CustomerSessionProvider";

type CustomerOrder = {
  _id: string;
  invoiceNumber: string;
  status: string;
  paymentStatus: string;
  providerStatus: string;
  quantity?: number;
  paymentMethodName?: string;
  providerMessage?: string;
  notes?: string;
  createdAt?: string;
  gameSnapshot?: {
    name?: string;
    logo?: string;
    category?: string;
  };
  variantSnapshot?: {
    name?: string;
  };
  price?: {
    currency?: string;
    totalAmount?: number;
    sellPrice?: number;
  };
};

function formatCurrency(value: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getStatusTone(status?: string) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "SUCCESS" || normalized === "PAID") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (normalized === "FAILED" || normalized === "EXPIRED") {
    return "border-red-400/20 bg-red-500/10 text-red-100";
  }

  if (normalized === "PROCESSING") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-100";
  }

  return "border-white/10 bg-white/5 text-white/70";
}

export default function CustomerDashboardClient() {
  const { customer, loading } = useCustomerSession();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!customer) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        setError("");
        const response = await fetch("/api/customer-orders/me?limit=20", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => ({
          items: [],
          message: "Respons riwayat transaksi tidak valid",
        }));

        if (!response.ok) {
          throw new Error(payload.message || "Gagal mengambil riwayat transaksi");
        }

        setOrders(Array.isArray(payload.items) ? payload.items : []);
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError") {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Gagal mengambil riwayat transaksi"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setOrdersLoading(false);
        }
      }
    };

    void fetchOrders();

    return () => controller.abort();
  }, [customer, loading]);

  const successfulOrders = useMemo(
    () => orders.filter((order) => order.status === "SUCCESS").length,
    [orders]
  );

  const totalSpent = useMemo(
    () =>
      orders.reduce(
        (sum, order) =>
          sum + Number(order.price?.totalAmount || order.price?.sellPrice || 0),
        0
      ),
    [orders]
  );

  if (loading) {
    return (
      <main className="pb-12 pt-6 sm:pb-16 sm:pt-10">
        <div className="site-shell">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-10 text-sm text-white/60">
            Memuat dashboard user...
          </div>
        </div>
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="pb-12 pt-6 sm:pb-16 sm:pt-10">
        <div className="site-shell">
          <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(211,59,59,0.12)_0%,rgba(17,18,23,0.98)_100%)] px-6 py-10 text-center shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:px-8">
            <div className="inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-200">
              Dashboard Member
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white">
              Masuk dulu untuk lihat dashboard
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/65 sm:text-[15px]">
              User tetap bisa beli dan cek transaksi tanpa login. Tapi untuk saldo
              KITAGG dan riwayat transaksi pribadi, kamu perlu masuk ke akun dulu.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/masuk"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(211,59,59,0.28)] transition hover:brightness-110"
              >
                Masuk
              </Link>
              <Link
                href="/daftar"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 px-6 text-sm font-semibold text-white/85 transition hover:bg-white/5 hover:text-white"
              >
                Buat Akun
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-12 pt-6 sm:pb-16 sm:pt-10">
      <div className="site-shell space-y-6">
        <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,rgba(211,59,59,0.18)_0%,rgba(17,18,23,0.96)_24%,rgba(17,18,23,0.98)_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
          <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:px-10 lg:py-10">
            <div>
              <div className="inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-200">
                Dashboard User
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Halo, {customer.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/66 sm:text-[15px]">
                Semua pembelian tetap bisa dilakukan tanpa login. Tapi kalau kamu
                masuk, di sini kamu bisa pantau saldo KITAGG dan histori transaksi
                pribadi dengan lebih rapi.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                    Username
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    @{customer.username}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                    Saldo KITAGG
                  </p>
                  <p className="mt-3 text-lg font-semibold text-red-200">
                    {formatCurrency(customer.balance)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                    Order Berhasil
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {successfulOrders}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                    Total Belanja
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {formatCurrency(totalSpent)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                Profil User
              </p>
              <div className="mt-5 space-y-4 text-sm">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                  <p className="text-white/42">Nama</p>
                  <p className="mt-2 font-medium text-white">{customer.name}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                  <p className="text-white/42">Email</p>
                  <p className="mt-2 font-medium text-white">{customer.email}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                  <p className="text-white/42">No. HP</p>
                  <p className="mt-2 font-medium text-white">
                    {customer.phoneCountryCode} {customer.phoneNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Riwayat Transaksi</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Riwayat ini otomatis mengambil order yang dibuat saat kamu login
                di KITAGG. Guest checkout tetap tidak terganggu.
              </p>
            </div>
            <Link
              href="/cek-transaksi"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 px-4 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              Cek transaksi umum
            </Link>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          {ordersLoading ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-white/58">
              Memuat riwayat transaksi...
            </div>
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
                          {order.gameSnapshot?.name || "-"}
                        </p>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70">
                          {Math.max(Number(order.quantity || 1), 1)}x
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusTone(order.status)}`}
                        >
                          {order.status || "UNPAID"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white/65">
                        {order.variantSnapshot?.name || "-"}
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
                            Number(
                              order.price?.totalAmount || order.price?.sellPrice || 0
                            ),
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
      </div>
    </main>
  );
}
