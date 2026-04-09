"use client";

import { useState } from "react";
import { Variant } from "@/app/types/Variant";

type Props = {
  games: Array<{
    _id: string;
    name: string;
  }>;
  variants: Variant[];
  onEdit: (variant: Variant) => void;
  onDelete: (id: string) => void;
};

export default function VariantList({
  games,
  variants,
  onEdit,
  onDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const normalizedSearch = search.trim().toLowerCase();
  const filteredVariants = variants.filter((variant) => {
    const matchesGame =
      gameFilter === "ALL" || variant.game?._id === gameFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (variant.status || "UNKNOWN") === statusFilter;

    const searchableText = [
      variant.name,
      variant.providerCode,
      variant.game?.name,
      variant.region,
      variant.status,
      variant.currency,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      normalizedSearch.length === 0 ||
      searchableText.includes(normalizedSearch);

    return matchesGame && matchesStatus && matchesSearch;
  });

  const statusOptions = Array.from(
    new Set(variants.map((variant) => variant.status || "UNKNOWN"))
  );

  return (
    <div className="rounded-2xl border bg-white p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Daftar Variant</h2>
          <p className="mt-1 text-sm text-gray-500">
            Menampilkan {filteredVariants.length} dari {variants.length} variant.
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
              onChange={(event) => setSearch(event.target.value)}
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
              onChange={(event) => setGameFilter(event.target.value)}
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
              onChange={(event) => setStatusFilter(event.target.value)}
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
        {variants.length === 0 ? (
          <p className="text-sm text-gray-500">
            Belum ada data variant yang tersimpan.
          </p>
        ) : null}

        {variants.length > 0 && filteredVariants.length === 0 ? (
          <p className="text-sm text-gray-500">
            Tidak ada variant yang cocok dengan pencarian.
          </p>
        ) : null}

        {filteredVariants.map((variant, index) => (
          <div
            key={variant._id}
            className="flex flex-col gap-4 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <p className="w-6 shrink-0 pt-1 text-sm text-gray-500">
                {index + 1}.
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
      </div>
    </div>
  );
}
