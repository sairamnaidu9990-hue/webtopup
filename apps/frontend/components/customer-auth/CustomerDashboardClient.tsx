"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCustomerSession } from "@/components/customer-auth/CustomerSessionProvider";
import type {
  StorefrontBalanceTransaction,
  StorefrontPaymentMethod,
} from "@/lib/siteData";

type CustomerOrder = {
  _id: string;
  invoiceNumber: string;
  orderType?: "PURCHASE" | "BALANCE_TOPUP";
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

const MIN_TOPUP_AMOUNT = 1000;
const MAX_TOPUP_AMOUNT = 10000000;

function formatCurrency(value: number, currency = "IDR") {
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

function getTransactionTone(transaction: StorefrontBalanceTransaction) {
  return transaction.type === "CREDIT"
    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
    : "border-red-400/20 bg-red-500/10 text-red-100";
}

function getTransactionLabel(transaction: StorefrontBalanceTransaction) {
  const source = String(transaction.source || "").toUpperCase();

  if (source === "BALANCE_TOPUP") {
    return "Topup Saldo";
  }

  if (source === "ORDER_PAYMENT") {
    return "Pembayaran dengan Saldo";
  }

  if (source === "ADMIN_CREDIT") {
    return "Isi Saldo Manual Admin";
  }

  if (source === "ADMIN_DEBIT") {
    return "Pengurangan Saldo Admin";
  }

  return transaction.type === "CREDIT" ? "Saldo Masuk" : "Saldo Keluar";
}

export default function CustomerDashboardClient() {
  const router = useRouter();
  const { customer, loading, refresh } = useCustomerSession();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [balanceTransactions, setBalanceTransactions] = useState<
    StorefrontBalanceTransaction[]
  >([]);
  const [paymentMethods, setPaymentMethods] = useState<StorefrontPaymentMethod[]>(
    []
  );
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [error, setError] = useState("");
  const [topupFeedback, setTopupFeedback] = useState("");
  const [topupAmount, setTopupAmount] = useState(String(MIN_TOPUP_AMOUNT));
  const [topupPaymentMethodCode, setTopupPaymentMethodCode] = useState("");
  const [topupSubmitting, setTopupSubmitting] = useState(false);

  useEffect(() => {
    if (!customer?.id) {
      return;
    }

    void refresh();
  }, [customer?.id, refresh]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!customer) {
      setOrders([]);
      setBalanceTransactions([]);
      setPaymentMethods([]);
      setTopupPaymentMethodCode("");
      setOrdersLoading(false);
      setBalanceLoading(false);
      setPaymentMethodsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchDashboardData = async () => {
      try {
        setOrdersLoading(true);
        setBalanceLoading(true);
        setPaymentMethodsLoading(true);
        setError("");

        const [ordersResponse, balanceResponse, paymentMethodsResponse] =
          await Promise.all([
            fetch("/api/customer-orders/me?limit=20", {
              cache: "no-store",
              signal: controller.signal,
            }),
            fetch("/api/customer-balance/transactions?limit=20", {
              cache: "no-store",
              signal: controller.signal,
            }),
            fetch("/api/payment-methods/public", {
              cache: "no-store",
              signal: controller.signal,
            }),
          ]);

        const [ordersPayload, balancePayload, paymentMethodsPayload] =
          await Promise.all([
            ordersResponse.json().catch(() => ({
              items: [],
              message: "Respons riwayat transaksi tidak valid",
            })),
            balanceResponse.json().catch(() => ({
              items: [],
              message: "Respons histori saldo tidak valid",
            })),
            paymentMethodsResponse.json().catch(() => ({
              items: [],
              message: "Respons metode pembayaran tidak valid",
            })),
          ]);

        if (!ordersResponse.ok) {
          throw new Error(
            ordersPayload.message || "Gagal mengambil riwayat transaksi"
          );
        }

        if (!balanceResponse.ok) {
          throw new Error(
            balancePayload.message || "Gagal mengambil histori saldo"
          );
        }

        if (!paymentMethodsResponse.ok) {
          throw new Error(
            paymentMethodsPayload.message || "Gagal mengambil metode pembayaran"
          );
        }

        const nextPaymentMethods = Array.isArray(paymentMethodsPayload.items)
          ? paymentMethodsPayload.items.filter(
              (paymentMethod: StorefrontPaymentMethod) =>
                paymentMethod.code !== "KITAGG_BALANCE"
            )
          : [];

        setOrders(Array.isArray(ordersPayload.items) ? ordersPayload.items : []);
        setBalanceTransactions(
          Array.isArray(balancePayload.items) ? balancePayload.items : []
        );
        setPaymentMethods(nextPaymentMethods);
        setTopupPaymentMethodCode((current) => {
          if (
            current &&
            nextPaymentMethods.some(
              (paymentMethod: StorefrontPaymentMethod) =>
                paymentMethod.code === current
            )
          ) {
            return current;
          }

          return nextPaymentMethods[0]?.code || "";
        });
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError") {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Gagal mengambil data dashboard user"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setOrdersLoading(false);
          setBalanceLoading(false);
          setPaymentMethodsLoading(false);
        }
      }
    };

    void fetchDashboardData();

    return () => controller.abort();
  }, [customer, loading]);

  const purchaseOrders = useMemo(
    () => orders.filter((order) => order.orderType !== "BALANCE_TOPUP"),
    [orders]
  );

  const successfulOrders = useMemo(
    () => purchaseOrders.filter((order) => order.status === "SUCCESS").length,
    [purchaseOrders]
  );

  const totalSpent = useMemo(
    () =>
      purchaseOrders.reduce(
        (sum, order) =>
          sum + Number(order.price?.totalAmount || order.price?.sellPrice || 0),
        0
      ),
    [purchaseOrders]
  );

  const totalTopupCredits = useMemo(
    () =>
      balanceTransactions
        .filter((transaction) => transaction.type === "CREDIT")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
    [balanceTransactions]
  );

  const handleTopupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Math.round(Number(topupAmount || 0));

    if (!Number.isFinite(amount) || amount < MIN_TOPUP_AMOUNT) {
      setError(
        `Nominal topup minimal Rp${MIN_TOPUP_AMOUNT.toLocaleString("id-ID")}`
      );
      return;
    }

    if (amount > MAX_TOPUP_AMOUNT) {
      setError(
        `Nominal topup maksimal Rp${MAX_TOPUP_AMOUNT.toLocaleString("id-ID")}`
      );
      return;
    }

    if (!topupPaymentMethodCode) {
      setError("Pilih metode pembayaran untuk topup saldo terlebih dahulu.");
      return;
    }

    try {
      setTopupSubmitting(true);
      setTopupFeedback("");
      setError("");

      const response = await fetch("/api/customer-balance/topups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          paymentMethodCode: topupPaymentMethodCode,
        }),
      });

      const payload = await response.json().catch(() => ({
        message: "Respons topup saldo tidak valid",
      }));

      if (!response.ok) {
        throw new Error(payload.message || "Gagal membuat invoice topup saldo");
      }

      const invoiceNumber =
        payload &&
        typeof payload === "object" &&
        payload.order &&
        typeof payload.order === "object"
          ? String(payload.order.invoiceNumber || "")
          : "";

      if (!invoiceNumber) {
        throw new Error("Invoice topup saldo tidak ditemukan");
      }

      setTopupFeedback(
        payload.message || "Invoice topup saldo berhasil dibuat."
      );
      router.push(`/invoice/${encodeURIComponent(invoiceNumber)}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Gagal membuat invoice topup saldo"
      );
    } finally {
      setTopupSubmitting(false);
    }
  };

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
              Halo, Gamer!
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/65 sm:text-[15px]">
              Masuk dulu untuk lihat dashboard kamu, cek riwayat transaksi, dan topup saldo KITAGG!
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
                Selamat datang di dashboard user KITAGG!
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
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                  <p className="text-white/42">Total Saldo Masuk</p>
                  <p className="mt-2 font-medium text-red-100">
                    {formatCurrency(totalTopupCredits)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {topupFeedback ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {topupFeedback}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Topup Saldo KITAGG
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Isi saldo pakai metode pembayaran aktif, lalu kamu bisa bayar
                  checkout game langsung dari saldo KITAGG.
                </p>
              </div>
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-100/60">
                  Saldo Saat Ini
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {formatCurrency(customer.balance)}
                </p>
              </div>
            </div>

            <form onSubmit={handleTopupSubmit} className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/84">
                  Nominal Topup
                </span>
                <input
                  type="number"
                  min={MIN_TOPUP_AMOUNT}
                  max={MAX_TOPUP_AMOUNT}
                  inputMode="numeric"
                  value={topupAmount}
                  onChange={(event) => setTopupAmount(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]"
                  placeholder={`Minimal ${MIN_TOPUP_AMOUNT.toLocaleString("id-ID")}`}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/84">
                  Metode Pembayaran
                </span>
                <select
                  value={topupPaymentMethodCode}
                  onChange={(event) =>
                    setTopupPaymentMethodCode(event.target.value)
                  }
                  disabled={paymentMethodsLoading || paymentMethods.length === 0}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]"
                >
                  {paymentMethods.length === 0 ? (
                    <option value="">Belum ada metode pembayaran aktif</option>
                  ) : null}
                  {paymentMethods.map((paymentMethod) => (
                    <option key={paymentMethod.code} value={paymentMethod.code}>
                      {paymentMethod.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/58">
                Topup saldo minimal Rp{MIN_TOPUP_AMOUNT.toLocaleString("id-ID")} dan
                maksimal Rp{MAX_TOPUP_AMOUNT.toLocaleString("id-ID")} per invoice.
              </div>

              <button
                type="submit"
                disabled={
                  topupSubmitting ||
                  paymentMethodsLoading ||
                  paymentMethods.length === 0
                }
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(211,59,59,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {topupSubmitting ? "Membuat Invoice Topup..." : "Buat Invoice Topup"}
              </button>
            </form>
          </div>

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
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-white/58">
                Memuat histori saldo...
              </div>
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
                            {formatCurrency(
                              transaction.balanceAfter,
                              transaction.currency
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Riwayat Transaksi</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Riwayat ini otomatis mengambil order yang dibuat saat kamu login
                di KITAGG, termasuk invoice topup saldo.
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
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusTone(order.status)}`}
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
