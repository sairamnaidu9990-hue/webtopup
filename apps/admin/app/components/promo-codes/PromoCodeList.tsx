"use client";

import type { PromoCode } from "@/app/types/PromoCode";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDiscount(promoCode: PromoCode) {
  if (promoCode.discountType === "percent") {
    return `${Number(promoCode.discountValue || 0).toFixed(2)}%`;
  }

  return formatCurrency(promoCode.discountValue || 0);
}

type PromoCodeListProps = {
  promoCodes: PromoCode[];
  categories: string[];
  search: string;
  statusFilter: string;
  categoryFilter: string;
  totalItems: number;
  page: number;
  totalPages: number;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onPageChange: (value: number) => void;
  onEdit: (promoCode: PromoCode) => void;
  onDelete: (id: string) => void;
};

export default function PromoCodeList({
  promoCodes,
  categories,
  search,
  statusFilter,
  categoryFilter,
  totalItems,
  page,
  totalPages,
  onSearchChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onPageChange,
  onEdit,
  onDelete,
}: PromoCodeListProps) {
  return (
    <section className="rounded-[28px] border border-[#f1d6d6] bg-white shadow-[0_20px_44px_rgba(125,19,19,0.08)]">
      <div className="border-b border-[#f3e0e0] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[#231919]">
              Daftar Promo
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#7a6363]">
              Pantau promo aktif, batas pemakaian harian, dan kategori mana saja
              yang sedang mendapat potongan harga.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[720px]">
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Cari kode atau judul promo"
              className="w-full rounded-2xl border border-[#ecd7d7] px-4 py-3 text-sm text-[#231919] outline-none transition focus:border-[#d33b3b]"
            />

            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value)}
              className="w-full rounded-2xl border border-[#ecd7d7] px-4 py-3 text-sm text-[#231919] outline-none transition focus:border-[#d33b3b]"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => onCategoryFilterChange(event.target.value)}
              className="w-full rounded-2xl border border-[#ecd7d7] px-4 py-3 text-sm text-[#231919] outline-none transition focus:border-[#d33b3b]"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="mb-4 flex flex-col gap-2 text-sm text-[#7a6363] sm:flex-row sm:items-center sm:justify-between">
          <p>
            Menampilkan <span className="font-semibold text-[#231919]">{promoCodes.length}</span>{" "}
            promo dari total{" "}
            <span className="font-semibold text-[#231919]">{totalItems}</span>{" "}
            data.
          </p>
          <p>
            Halaman <span className="font-semibold text-[#231919]">{page}</span> dari{" "}
            <span className="font-semibold text-[#231919]">{totalPages}</span>
          </p>
        </div>

        {promoCodes.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {promoCodes.map((promoCode) => {
              const isActive = promoCode.isActive;
              const isUnlimited = Number(promoCode.maxDailyUses || 0) <= 0;

              return (
                <article
                  key={promoCode._id}
                  className="rounded-[24px] border border-[#f0dede] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f8_100%)] p-5 shadow-[0_16px_32px_rgba(125,19,19,0.06)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#231919] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                          {promoCode.code}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                            isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-semibold tracking-tight text-[#231919]">
                        {promoCode.title || "Promo tanpa judul"}
                      </h3>
                      {promoCode.description ? (
                        <p className="mt-2 text-sm leading-6 text-[#7a6363]">
                          {promoCode.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-[20px] border border-[#edd4d4] bg-white px-4 py-3 text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c25a5a]">
                        Diskon
                      </p>
                      <p className="mt-1 text-xl font-semibold text-[#d33b3b]">
                        {formatDiscount(promoCode)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-[#f0dede] bg-white px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#c25a5a]">
                        Minimal Order
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#231919]">
                        {formatCurrency(promoCode.minimumOrderAmount || 0)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#f0dede] bg-white px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#c25a5a]">
                        Limit Harian
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#231919]">
                        {isUnlimited
                          ? "Tanpa batas"
                          : `${promoCode.dailyUsageCount || 0}/${promoCode.maxDailyUses}`}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#f0dede] bg-white px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#c25a5a]">
                        Sisa Hari Ini
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#231919]">
                        {isUnlimited
                          ? "Unlimited"
                          : Number(promoCode.remainingDailyUses ?? 0)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#f0dede] bg-white px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#c25a5a]">
                        Urutan
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#231919]">
                        {promoCode.order || 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c25a5a]">
                      Kategori Berlaku
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {promoCode.applicableCategories.length > 0 ? (
                        promoCode.applicableCategories.map((category) => (
                          <span
                            key={category}
                            className="rounded-full border border-[#edd4d4] bg-white px-3 py-1.5 text-xs font-medium text-[#7a6363]"
                          >
                            {category}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-[#edd4d4] bg-white px-3 py-1.5 text-xs font-medium text-[#7a6363]">
                          Semua kategori
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-[#8d7272]">
                      Dibuat{" "}
                      <span className="font-semibold text-[#231919]">
                        {promoCode.createdAt
                          ? new Intl.DateTimeFormat("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(promoCode.createdAt))
                          : "-"}
                      </span>
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(promoCode)}
                        className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#ead1d1] px-4 text-sm font-semibold text-[#8e3a3a] transition hover:border-[#d33b3b] hover:text-[#d33b3b]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(promoCode._id)}
                        className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#231919] px-4 text-sm font-semibold text-white transition hover:bg-[#3a2020]"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[#ead1d1] bg-[#fff9f9] px-5 py-8 text-center text-sm text-[#7a6363]">
            Belum ada promo yang cocok dengan filter saat ini.
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#ead1d1] px-4 text-sm font-semibold text-[#8e3a3a] transition hover:border-[#d33b3b] hover:text-[#d33b3b] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sebelumnya
            </button>

            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#ead1d1] px-4 text-sm font-semibold text-[#8e3a3a] transition hover:border-[#d33b3b] hover:text-[#d33b3b] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
