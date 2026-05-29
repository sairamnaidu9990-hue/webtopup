"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "@/app/components/ui/Card";
import SectionTitle from "@/app/components/ui/SectionTitle";
import type { CustomerAccount } from "@/app/types/Customer";

type CustomerBalanceTransaction = {
  id: string;
  type: string;
  source: string;
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  invoiceNumber: string;
  orderId: string;
  createdByAdmin: string;
  createdAt?: string | null;
};

const emptyForm = {
  username: "",
  name: "",
  email: "",
  phoneCountryCode: "+62",
  phoneNumber: "",
  isActive: true,
};

const emptyBalanceForm = {
  type: "CREDIT" as "CREDIT" | "DEBIT",
  amount: "",
  note: "",
};

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatCurrency(value: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function getTransactionTone(transaction: CustomerBalanceTransaction) {
  return transaction.type === "CREDIT"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-red-200 bg-red-50 text-red-700";
}

function getTransactionLabel(transaction: CustomerBalanceTransaction) {
  const source = String(transaction.source || "").toUpperCase();

  if (source === "BALANCE_TOPUP") {
    return "Topup Saldo User";
  }

  if (source === "ORDER_PAYMENT") {
    return "Pembayaran dengan Saldo";
  }

  if (source === "ADMIN_CREDIT") {
    return "Isi Saldo Manual";
  }

  if (source === "ADMIN_DEBIT") {
    return "Pengurangan Saldo";
  }

  if (source === "REFERRAL_WELCOME_BONUS") {
    return "Bonus Referral User Baru";
  }

  if (source === "REFERRAL_REFERRER_BONUS") {
    return "Bonus Referral Pengajak";
  }

  if (source === "LOYALTY_REDEEM_BALANCE") {
    return "Tukar Poin ke Saldo";
  }

  return transaction.type === "CREDIT" ? "Saldo Masuk" : "Saldo Keluar";
}

function SummaryMetric({ loading, value }: { loading: boolean; value: string }) {
  if (loading) {
    return <div className="h-10 w-24 animate-pulse rounded-2xl bg-white/35" />;
  }

  return <p className="text-4xl font-bold tracking-tight">{value}</p>;
}

function CustomerListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
        >
          <div className="animate-pulse space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-5 w-36 rounded-xl bg-gray-200" />
              <div className="h-5 w-24 rounded-full bg-gray-200" />
              <div className="h-5 w-20 rounded-full bg-gray-200" />
            </div>
            <div className="h-4 w-56 max-w-full rounded-xl bg-gray-200/80" />
            <div className="h-4 w-44 rounded-xl bg-gray-200/70" />
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="h-12 rounded-2xl bg-white" />
              <div className="h-12 rounded-2xl bg-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BalanceTransactionsSkeleton() {
  return (
    <div className="mt-4 space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
        >
          <div className="animate-pulse space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-5 w-32 rounded-full bg-white" />
              <div className="h-5 w-24 rounded-full bg-white" />
            </div>
            <div className="h-4 w-2/3 rounded-xl bg-gray-200" />
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="h-14 rounded-2xl bg-white" />
              <div className="h-14 rounded-2xl bg-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CustomersPageClient() {
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [balanceSubmitting, setBalanceSubmitting] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL"
  );
  const [form, setForm] = useState(emptyForm);
  const [balanceForm, setBalanceForm] = useState(emptyBalanceForm);
  const [balanceTransactions, setBalanceTransactions] = useState<
    CustomerBalanceTransaction[]
  >([]);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/customers", {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({
        customers: [],
        message: "Respons data user tidak valid",
      }));

      if (!response.ok) {
        throw new Error(payload.message || "Gagal mengambil data user");
      }

      setCustomers(Array.isArray(payload.customers) ? payload.customers : []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Gagal mengambil data user"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBalanceTransactions = useCallback(async (customerId: string) => {
    try {
      setBalanceLoading(true);
      const response = await fetch(
        `/api/customers/${customerId}/balance-transactions?limit=20`,
        {
          cache: "no-store",
        }
      );
      const payload = await response.json().catch(() => ({
        items: [],
        message: "Respons histori saldo user tidak valid",
      }));

      if (!response.ok) {
        throw new Error(payload.message || "Gagal mengambil histori saldo user");
      }

      setBalanceTransactions(Array.isArray(payload.items) ? payload.items : []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Gagal mengambil histori saldo user"
      );
      setBalanceTransactions([]);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return customers.filter((customer) => {
      if (statusFilter === "ACTIVE" && !customer.isActive) {
        return false;
      }

      if (statusFilter === "INACTIVE" && customer.isActive) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        customer.id,
        customer.username,
        customer.name,
        customer.email,
        customer.phoneCountryCode,
        customer.phoneNumber,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [customers, search, statusFilter]);

  const totalBalance = useMemo(
    () => customers.reduce((sum, customer) => sum + Number(customer.balance || 0), 0),
    [customers]
  );

  const activeCustomers = useMemo(
    () => customers.filter((customer) => customer.isActive).length,
    [customers]
  );

  const inactiveCustomers = useMemo(
    () => customers.filter((customer) => !customer.isActive).length,
    [customers]
  );

  const openEdit = async (customer: CustomerAccount) => {
    setSelectedCustomerId(customer.id);
    setForm({
      username: customer.username || "",
      name: customer.name || "",
      email: customer.email || "",
      phoneCountryCode: customer.phoneCountryCode || "+62",
      phoneNumber: customer.phoneNumber || "",
      isActive: Boolean(customer.isActive),
    });
    setBalanceForm(emptyBalanceForm);
    setFeedback("");
    setError("");
    setBalanceTransactions([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
    await fetchBalanceTransactions(customer.id);
  };

  const resetEditor = () => {
    setSelectedCustomerId(null);
    setForm(emptyForm);
    setBalanceForm(emptyBalanceForm);
    setBalanceTransactions([]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCustomerId) {
      return;
    }

    try {
      setSubmitting(true);
      setFeedback("");
      setError("");

      const response = await fetch(`/api/customers/${selectedCustomerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.username,
          name: form.name,
          email: form.email,
          phoneCountryCode: form.phoneCountryCode,
          phoneNumber: form.phoneNumber,
          isActive: form.isActive,
        }),
      });
      const payload = await response.json().catch(() => ({
        message: "Respons update user tidak valid",
      }));

      if (!response.ok) {
        throw new Error(payload.message || "Gagal memperbarui user");
      }

      setFeedback(payload.message || "User berhasil diperbarui");
      await fetchCustomers();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Gagal memperbarui user"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBalanceSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCustomerId) {
      return;
    }

    const amount = Math.round(Number(balanceForm.amount || 0));

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Nominal saldo harus lebih dari 0");
      return;
    }

    try {
      setBalanceSubmitting(true);
      setFeedback("");
      setError("");

      const response = await fetch(
        `/api/customers/${selectedCustomerId}/balance-adjustments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: balanceForm.type,
            amount,
            note: balanceForm.note,
          }),
        }
      );
      const payload = await response.json().catch(() => ({
        message: "Respons penyesuaian saldo tidak valid",
      }));

      if (!response.ok) {
        throw new Error(payload.message || "Gagal menyesuaikan saldo user");
      }

      setFeedback(payload.message || "Saldo user berhasil disesuaikan");
      setBalanceForm(emptyBalanceForm);
      await Promise.all([
        fetchCustomers(),
        fetchBalanceTransactions(selectedCustomerId),
      ]);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Gagal menyesuaikan saldo user"
      );
    } finally {
      setBalanceSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Users"
        subtitle="Kelola akun member storefront tanpa mengganggu flow guest checkout. Admin bisa edit data user, aktif/nonaktifkan akun, isi saldo manual, dan melihat histori mutasi saldo KITAGG."
      />

      {feedback ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Total User" variant="info">
          <SummaryMetric loading={loading} value={String(customers.length)} />
        </Card>

        <Card title="User Aktif" variant="success">
          <SummaryMetric loading={loading} value={String(activeCustomers)} />
          <p className="mt-2 text-sm text-white/78">{inactiveCustomers} user nonaktif</p>
        </Card>

        <Card title="Total Saldo KITAGG" variant="warning">
          {loading ? (
            <div className="h-8 w-36 animate-pulse rounded-2xl bg-white/35" />
          ) : (
            <p className="text-3xl font-bold tracking-tight">
              {formatCurrency(totalBalance)}
            </p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card title={selectedCustomer ? `Kelola ${selectedCustomer.name}` : "Editor User"}>
          {!selectedCustomer ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              Pilih salah satu user dari daftar di kanan untuk mulai edit data,
              aktif/nonaktifkan akun, atau isi saldo KITAGG manual.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                      User ID
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-700">
                      {selectedCustomer.id}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Referral: {selectedCustomer.referralCode || "-"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-400">
                        Saldo Saat Ini
                      </p>
                      <p className="mt-2 text-base font-semibold text-gray-900">
                        {formatCurrency(Number(selectedCustomer.balance || 0))}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-500">
                        Loyalty Points
                      </p>
                      <p className="mt-2 text-base font-semibold text-gray-900">
                        {Number(selectedCustomer.loyaltyPoints || 0).toLocaleString(
                          "id-ID"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Username</label>
                  <input
                    value={form.username}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status Akun</label>
                  <select
                    value={form.isActive ? "true" : "false"}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.value === "true",
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
                  >
                    <option value="true">ACTIVE</option>
                    <option value="false">INACTIVE</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Nama</label>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Kode Negara</label>
                  <input
                    value={form.phoneCountryCode}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phoneCountryCode: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">No. HP</label>
                  <input
                    value={form.phoneNumber}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phoneNumber: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
                  />
                </div>

                <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>

                  <button
                    type="button"
                    onClick={resetEditor}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                </div>
              </form>

              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Isi Saldo Manual
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Tambah atau kurangi saldo user tanpa mengubah data profil.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleBalanceSubmit}
                  className="mt-4 grid gap-3 lg:grid-cols-[180px_180px_minmax(0,1fr)_180px]"
                >
                  <select
                    value={balanceForm.type}
                    onChange={(event) =>
                      setBalanceForm((current) => ({
                        ...current,
                        type: event.target.value as "CREDIT" | "DEBIT",
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
                  >
                    <option value="CREDIT">Tambah Saldo</option>
                    <option value="DEBIT">Kurangi Saldo</option>
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={balanceForm.amount}
                    onChange={(event) =>
                      setBalanceForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    placeholder="Nominal"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
                  />

                  <input
                    type="text"
                    value={balanceForm.note}
                    onChange={(event) =>
                      setBalanceForm((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    placeholder="Catatan admin (opsional)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
                  />

                  <button
                    type="submit"
                    disabled={balanceSubmitting}
                    className="inline-flex items-center justify-center rounded-xl bg-[#d33b3b] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {balanceSubmitting ? "Memproses..." : "Simpan Saldo"}
                  </button>
                </form>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Histori Mutasi Saldo
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Jejak masuk dan keluar saldo user ini.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      selectedCustomerId
                        ? void fetchBalanceTransactions(selectedCustomerId)
                        : undefined
                    }
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                </div>

                {balanceLoading ? (
                  <BalanceTransactionsSkeleton />
                ) : balanceTransactions.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                    Belum ada mutasi saldo untuk user ini.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {balanceTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
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
                                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                                  {transaction.invoiceNumber}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-3 text-sm font-medium text-gray-900">
                              {transaction.description || getTransactionLabel(transaction)}
                            </p>
                            <p className="mt-2 text-xs text-gray-400">
                              {formatDate(transaction.createdAt)}
                            </p>
                          </div>

                          <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2 lg:min-w-[240px]">
                            <div className="rounded-2xl border border-gray-200 bg-white px-3 py-3">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
                                Nominal
                              </p>
                              <p className="mt-2 font-semibold text-gray-900">
                                {transaction.type === "DEBIT" ? "-" : "+"}
                                {formatCurrency(
                                  transaction.amount,
                                  transaction.currency
                                )}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-gray-200 bg-white px-3 py-3">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
                                Saldo Akhir
                              </p>
                              <p className="mt-2 font-semibold text-gray-900">
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
            </div>
          )}
        </Card>

        <Card title="Daftar User">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari ID, username, nama, email, atau nomor HP"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "ALL" | "ACTIVE" | "INACTIVE"
                  )
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
              >
                <option value="ALL">Semua status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            {loading ? (
              <CustomerListSkeleton />
            ) : filteredCustomers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                Belum ada user yang cocok dengan filter saat ini.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => void openEdit(customer)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedCustomerId === customer.id
                        ? "border-black bg-gray-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900">{customer.name}</p>
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                            @{customer.username}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              customer.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {customer.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{customer.email}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          {(customer.phoneCountryCode || "+62").trim()}{" "}
                          {(customer.phoneNumber || "-").trim()}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          Referral: {customer.referralCode || "-"} • Poin:{" "}
                          {Number(customer.loyaltyPoints || 0).toLocaleString("id-ID")}
                        </p>
                        <p className="mt-2 text-xs text-gray-400">
                          ID: {customer.id}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Dibuat {formatDate(customer.createdAt)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                          Saldo KITAGG
                        </p>
                        <p className="mt-2 text-base font-semibold text-gray-900">
                          {formatCurrency(Number(customer.balance || 0))}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
