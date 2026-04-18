"use client";

import { Variant } from "@/app/types/Variant";
import PaginationControls from "@/app/components/ui/PaginationControls";

type Props = {
  games: Array<{
    _id: string;
    name: string;
  }>;
  variants: Variant[];
  search: string;
  gameFilter: string;
  statusFilter: string;
  totalItems: number;
  page: number;
  totalPages: number;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onGameFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onEdit: (variant: Variant) => void;
  onDelete: (id: string) => void;
};

export default function VariantList({
  games,
  variants,
  search,
  gameFilter,
  statusFilter,
  totalItems,
  page,
  totalPages,
  loading,
  onSearchChange,
  onGameFilterChange,
  onStatusFilterChange,
  onPageChange,
  onEdit,
  onDelete,
}: Props) {
  const getVariantCategoryName = (variant: Variant) =>
    variant.game?.variantCategories?.find(
      (category) => category._id === variant.variantCategoryId
    )?.name || "Tanpa kategori";

  const statusOptions = ["ACTIVE", "INACTIVE"];

  return (
    <div className="rounded-2xl border bg-white p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Daftar Variant</h2>
          <p className="mt-1 text-sm text-gray-500">
            Menampilkan {variants.length} dari {totalItems} variant.
          </p>
        </div>

        <div className="grid w-full gap-3 md:grid-cols-3 lg:max-w-3xl">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Cari variant
            </label>
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Cari nama variant, game, kode provider, atau region"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Game
            </label>
            <select
              value={gameFilter}
              onChange={(event) => onGameFilterChange(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            >
              <option value="ALL">Semua game</option>
              {games.map((game) => (
                <option key={game._id} value={game._id}>
                  {game.name}
                </option>
              ))}
            </select>
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
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loading && totalItems === 0 ? (
          <p className="text-sm text-gray-500">Memuat data variant...</p>
        ) : null}

        {!loading && totalItems === 0 ? (
          <p className="text-sm text-gray-500">
            Belum ada data variant yang tersimpan.
          </p>
        ) : null}

        {!loading && totalItems > 0 && variants.length === 0 ? (
          <p className="text-sm text-gray-500">
            Tidak ada variant yang cocok dengan pencarian.
          </p>
        ) : null}

        {variants.map((variant, index) => (
          <div
            key={variant._id}
            className="flex flex-col gap-4 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <p className="w-6 shrink-0 pt-1 text-sm text-gray-500">
                {(page - 1) * 20 + index + 1}.
              </p>

              {variant.logo ? (
                <img
                  src={variant.logo}
                  alt={variant.name}
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
              ) : null}

              <div className="min-w-0">
                <p className="break-words font-medium">{variant.name}</p>
                <p className="text-xs text-gray-500">
                  {variant.game?.name || "-"} • {variant.providerCode}
                </p>
                <p className="text-xs text-gray-400">
                  {variant.currency || "IDR"} {variant.price} • Modal{" "}
                  {variant.basePrice} • {variant.markup}%
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                    {variant.status || "UNKNOWN"}
                  </span>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-600">
                    {variant.syncSource || "manual"}
                  </span>
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                    {variant.region || "ID"} • {variant.duration || 0} min
                  </span>
                  <span className="rounded-full bg-fuchsia-50 px-2 py-1 text-fuchsia-700">
                    {getVariantCategoryName(variant)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex w-full justify-end gap-3 sm:w-auto">
              <button
                onClick={() => onEdit(variant)}
                className="text-sm text-blue-600"
              >
                Ubah
              </button>

              <button
                onClick={() => onDelete(variant._id)}
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
          itemLabel="variant"
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
