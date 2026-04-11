"use client";

import { useState } from "react";

type Game = {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  bannerUrl?: string;
  category?: string;
  provider?: string;
  status?: string;
  isTrending?: boolean;
  trendingOrder?: number;
  catalogOrder?: number;
  syncSource?: string;
  inputs?: Array<{
    name: string;
    type?: string;
    title?: string;
    options?: Array<{
      value: string;
      title: string;
    }>;
  }>;
};

type Props = {
  games: Game[];
  onEdit: (game: Game) => void;
  onDelete: (id: string) => void;
};

export default function GameList({ games, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const statusOptions = Array.from(
    new Set(games.map((game) => game.status || "UNKNOWN"))
  );
  const sourceOptions = Array.from(
    new Set(games.map((game) => game.syncSource || "manual"))
  );
  const categoryOptions = Array.from(
    new Set(games.map((game) => game.category || "Topup Game"))
  );

  const normalizedSearch = search.trim().toLowerCase();
  const filteredGames = games.filter((game) => {
    const matchesStatus =
      statusFilter === "ALL" || (game.status || "UNKNOWN") === statusFilter;
    const matchesSource =
      sourceFilter === "ALL" || (game.syncSource || "manual") === sourceFilter;
    const matchesCategory =
      categoryFilter === "ALL" ||
      (game.category || "Topup Game") === categoryFilter;

    const searchableText = [
      game.name,
      game.code,
      game.provider,
      game.category,
      game.bannerUrl ? "banner" : "",
      game.status,
      game.syncSource,
      String(game.catalogOrder ?? ""),
      game.isTrending ? "trending" : "",
      String(game.trendingOrder ?? ""),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      normalizedSearch.length === 0 ||
      searchableText.includes(normalizedSearch);

    return matchesStatus && matchesSource && matchesCategory && matchesSearch;
  });

  return (
    <div className="rounded-2xl border bg-white p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Daftar Game</h2>
          <p className="mt-1 text-sm text-gray-500">
            Menampilkan {filteredGames.length} dari {games.length} game.
          </p>
        </div>

        <div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-4 lg:max-w-5xl">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Cari game
            </label>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama game, kode, provider, atau status"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            />
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

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Sumber Data
            </label>
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            >
              <option value="ALL">Semua sumber</option>
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
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
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            >
              <option value="ALL">Semua kategori</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {games.length === 0 ? (
          <p className="text-sm text-gray-500">
            Belum ada data game yang tersimpan.
          </p>
        ) : null}

        {games.length > 0 && filteredGames.length === 0 ? (
          <p className="text-sm text-gray-500">
            Tidak ada game yang cocok dengan pencarian.
          </p>
        ) : null}

        {filteredGames.map((game, index) => (
          <div
            key={game._id}
            className="flex flex-col gap-4 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <p className="w-6 shrink-0 pt-1 text-sm text-gray-500">
                {index + 1}.
              </p>

              {game.logo && (
                <img
                  src={game.logo}
                  alt={game.name}
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
              )}

              <div className="min-w-0">
                <p className="break-words font-medium">{game.name}</p>
                <p className="text-xs text-gray-500">
                  {game.provider || "Provider belum diisi"}{" "}
                  {game.code ? `• ${game.code}` : ""}
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                    {game.status || "UNKNOWN"}
                  </span>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-600">
                    {game.syncSource || "manual"}
                  </span>
                  <span className="rounded-full bg-violet-50 px-2 py-1 text-violet-700">
                    {game.category || "Topup Game"}
                  </span>
                  {game.isTrending ? (
                    <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-700">
                      Trending #{game.trendingOrder ?? 9999}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                    All Games #{game.catalogOrder ?? 9999}
                  </span>
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                    Input: {game.inputs?.length || 0}
                  </span>
                  {game.bannerUrl ? (
                    <span className="rounded-full bg-violet-50 px-2 py-1 text-violet-700">
                      Banner siap
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex w-full justify-end gap-3 sm:w-auto">
              <button
                onClick={() => onEdit(game)}
                className="text-sm text-blue-600"
              >
                Ubah
              </button>

              <button
                onClick={() => onDelete(game._id)}
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
