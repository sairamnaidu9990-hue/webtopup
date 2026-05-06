"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "@/app/components/ui/Card";
import SectionTitle from "@/app/components/ui/SectionTitle";
import type { CustomerAccount } from "@/app/types/Customer";

const emptyForm = {
  username: "",
  name: "",
  email: "",
  phoneCountryCode: "+62",
  phoneNumber: "",
  balance: 0,
  isActive: true,
};

function formatDate(value?: string) {
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export default function CustomersPageClient() {
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL"
  );
  const [form, setForm] = useState(emptyForm);
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

  const openEdit = (customer: CustomerAccount) => {
    setSelectedCustomerId(customer.id);
    setForm({
      username: customer.username || "",
      name: customer.name || "",
      email: customer.email || "",
      phoneCountryCode: customer.phoneCountryCode || "+62",
      phoneNumber: customer.phoneNumber || "",
      balance: Number(customer.balance || 0),
      isActive: Boolean(customer.isActive),
    });
    setFeedback("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetEditor = () => {
    setSelectedCustomerId(null);
    setForm(emptyForm);
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
          balance: Number(form.balance || 0),
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
      resetEditor();
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

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Users"
        subtitle="Kelola akun member storefront tanpa mengganggu flow guest checkout. Admin bisa lihat data user, saldo KITAGG, lalu aktif/nonaktifkan akun saat diperlukan."
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
          <p className="text-4xl font-bold tracking-tight">{customers.length}</p>
        </Card>

        <Card title="User Aktif" variant="success">
          <p className="text-4xl font-bold tracking-tight">{activeCustomers}</p>
          <p className="mt-2 text-sm text-white/78">{inactiveCustomers} user nonaktif</p>
        </Card>

        <Card title="Total Saldo KITAGG" variant="warning">
          <p className="text-3xl font-bold tracking-tight">
            {formatCurrency(totalBalance)}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card title={selectedCustomer ? `Edit ${selectedCustomer.name}` : "Editor User"}>
          {!selectedCustomer ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              Pilih salah satu user dari daftar di kanan untuk mulai edit data,
              saldo, atau status akun.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">User ID</label>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  {selectedCustomer.id}
                </div>
              </div>

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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                  required
                />
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Saldo KITAGG</label>
                <input
                  type="number"
                  min="0"
                  value={form.balance}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      balance: Number(event.target.value || 0),
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                >
                  <option value="true">ACTIVE</option>
                  <option value="false">INACTIVE</option>
                </select>
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
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "ALL" | "ACTIVE" | "INACTIVE"
                  )
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
              >
                <option value="ALL">Semua status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500">Memuat data user...</p>
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
                    onClick={() => openEdit(customer)}
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
