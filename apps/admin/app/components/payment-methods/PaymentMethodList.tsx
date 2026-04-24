"use client";

import PaginationControls from "@/app/components/ui/PaginationControls";
import type {
  PaymentMethod,
  PaymentMethodCategory,
  PaymentMethodType,
} from "@/app/types/PaymentMethod";

const PAYMENT_TYPES: PaymentMethodType[] = [
  "bank_transfer",
  "virtual_account",
  "ewallet",
  "qris",
  "retail",
];

type Props = {
  categories: PaymentMethodCategory[];
  paymentMethods: PaymentMethod[];
  search: string;
  statusFilter: string;
  typeFilter: string;
  categoryFilter: string;
  totalItems: number;
  page: number;
  totalPages: number;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onEdit: (paymentMethod: PaymentMethod) => void;
  onDelete: (id: string) => void;
};

function formatFee(paymentMethod: PaymentMethod) {
  const feeFixed =
    paymentMethod.feeFixed != null
      ? Number(paymentMethod.feeFixed || 0)
      : paymentMethod.feeType === "percent"
      ? 0
      : Number(paymentMethod.feeValue || 0);
  const feePercent =
    paymentMethod.feePercent != null
      ? Number(paymentMethod.feePercent || 0)
      : paymentMethod.feeType === "percent"
      ? Number(paymentMethod.feeValue || 0)
      : 0;
  const parts = [];

  if (feeFixed > 0) {
    try {
      parts.push(
        new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: paymentMethod.currency || "IDR",
          maximumFractionDigits: 0,
        }).format(feeFixed)
      );
    } catch {
      parts.push(`${paymentMethod.currency || "IDR"} ${feeFixed}`);
    }
  }

  if (feePercent > 0) {
    parts.push(
      Number.isInteger(feePercent)
        ? `${feePercent}%`
        : `${feePercent.toFixed(2)}%`
    );
  }

  return parts.length > 0 ? parts.join(" + ") : "Tanpa biaya";
}

export default function PaymentMethodList({
  categories,
  paymentMethods,
  search,
  statusFilter,
  typeFilter,
  categoryFilter,
  totalItems,
  page,
  totalPages,
  onSearchChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onCategoryFilterChange,
  onPageChange,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Daftar Metode Pembayaran</h2>
          <p className="mt-1 text-sm text-gray-500">
            Menampilkan {paymentMethods.length} dari {totalItems} metode pembayaran.
          </p>
        </div>

        <div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-4 lg:max-w-5xl">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Cari Metode
            </label>
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Cari nama, kode, provider, atau channel"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            >
              <option value="ALL">Semua status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Jenis
            </label>
            <select
              value={typeFilter}
              onChange={(event) => onTypeFilterChange(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            >
              <option value="ALL">Semua jenis</option>
              {PAYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Kategori
            </label>
            <select
              value={categoryFilter}
              onChange={(event) => onCategoryFilterChange(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            >
              <option value="ALL">Semua kategori</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {totalItems === 0 ? (
          <p className="text-sm text-gray-500">
            Belum ada metode pembayaran yang tersimpan.
          </p>
        ) : null}

        {totalItems > 0 && paymentMethods.length === 0 ? (
          <p className="text-sm text-gray-500">
            Tidak ada metode pembayaran yang cocok dengan pencarian.
          </p>
        ) : null}

        {paymentMethods.map((paymentMethod, index) => (
          <div
            key={paymentMethod._id}
            className="flex flex-col gap-4 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <p className="w-6 shrink-0 pt-1 text-sm text-gray-500">
                {(page - 1) * 20 + index + 1}.
              </p>

              {paymentMethod.logo ? (
                <img
                  src={paymentMethod.logo}
                  alt={paymentMethod.name}
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-500">
                  {paymentMethod.name.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <p className="break-words font-medium">{paymentMethod.name}</p>
                <p className="text-xs text-gray-500">
                  {paymentMethod.code} • {paymentMethod.provider || "manual"}
                </p>
                <p className="text-xs text-gray-400">
                  Fee {formatFee(paymentMethod)} • Urutan {paymentMethod.order}
                </p>
                {paymentMethod.accountNumber ? (
                  <p className="text-xs text-gray-400">
                    Rek {paymentMethod.accountNumber}
                    {paymentMethod.accountHolderName
                      ? ` • ${paymentMethod.accountHolderName}`
                      : ""}
                  </p>
                ) : null}
                <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-fuchsia-50 px-2 py-1 text-fuchsia-700">
                    {paymentMethod.category?.name || "Tanpa kategori"}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                    {paymentMethod.type}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 ${
                      paymentMethod.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {paymentMethod.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                  {paymentMethod.gatewayChannelCode ? (
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-600">
                      {paymentMethod.gatewayChannelCode}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex w-full justify-end gap-3 sm:w-auto">
              <button
                onClick={() => onEdit(paymentMethod)}
                className="text-sm text-blue-600"
              >
                Ubah
              </button>

              <button
                onClick={() => onDelete(paymentMethod._id)}
                className="text-sm text-red-500"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}

        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={20}
          itemLabel="metode pembayaran"
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
