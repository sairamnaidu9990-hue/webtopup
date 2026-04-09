"use client";

import { useMemo, useState } from "react";

type Game = {
  _id: string;
  name: string;
  code: string;
};

type SyncFeedback = {
  tone: "success" | "error";
  title: string;
  description: string;
};

type Props = {
  apiBase: string;
  games: Game[];
  onSynced: () => Promise<void> | void;
};

export default function VariantMarkupSyncPanel({
  apiBase,
  games,
  onSynced,
}: Props) {
  const [globalMarkup, setGlobalMarkup] = useState("0");
  const [selectedGameId, setSelectedGameId] = useState("");
  const [gameMarkup, setGameMarkup] = useState("0");
  const [submittingScope, setSubmittingScope] = useState<"all" | "game" | null>(
    null
  );
  const [feedback, setFeedback] = useState<SyncFeedback | null>(null);

  const selectedGame = useMemo(
    () => games.find((game) => game._id === selectedGameId) || null,
    [games, selectedGameId]
  );

  const syncMarkup = async ({
    scope,
    markup,
    gameId,
  }: {
    scope: "all" | "game";
    markup: string;
    gameId?: string;
  }) => {
    const markupValue = Number(markup);

    if (!Number.isFinite(markupValue)) {
      setFeedback({
        tone: "error",
        title: "Markup tidak valid",
        description: "Masukkan angka markup yang valid sebelum menjalankan sinkronisasi.",
      });
      return;
    }

    if (scope === "game" && !gameId) {
      setFeedback({
        tone: "error",
        title: "Game belum dipilih",
        description: "Pilih game terlebih dahulu untuk menjalankan sinkronisasi markup per game.",
      });
      return;
    }

    setSubmittingScope(scope);
    setFeedback(null);

    try {
      const response = await fetch(
        scope === "all"
          ? `${apiBase}/api/variants/markup/all`
          : `${apiBase}/api/variants/markup/game/${gameId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ markup: markupValue }),
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Sinkronisasi markup gagal");
      }

      const summary = payload.summary || {};

      setFeedback({
        tone: "success",
        title:
          scope === "all"
            ? "Sync markup semua variant berhasil"
            : "Sync markup per game berhasil",
        description:
          scope === "all"
            ? `${summary.updatedCount ?? 0} variant diperbarui ke markup ${summary.markup ?? markupValue}% secara massal.`
            : `${summary.updatedCount ?? 0} variant untuk ${summary.game?.name || selectedGame?.name || "game terpilih"} diperbarui ke markup ${summary.markup ?? markupValue}%.`,
      });

      await onSynced();
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Sinkronisasi markup gagal",
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kendala saat memperbarui markup variant.",
      });
    } finally {
      setSubmittingScope(null);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="max-w-3xl">
        <h2 className="text-lg font-semibold text-gray-900">
          Sinkronisasi Markup Variant
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          Gunakan kontrol ini untuk menyamakan markup massal tanpa mengubah
          data variant satu per satu. Harga jual akan dihitung ulang dari harga
          modal yang sudah tersimpan di database.
        </p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">
            Sync Markup Semua Variant
          </p>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Terapkan satu nilai markup ke seluruh variant aktif maupun nonaktif
            yang tersimpan saat ini.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Markup global (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={globalMarkup}
                onChange={(event) => setGlobalMarkup(event.target.value)}
                placeholder="Contoh: 5"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                syncMarkup({
                  scope: "all",
                  markup: globalMarkup,
                })
              }
              disabled={submittingScope !== null}
              className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {submittingScope === "all"
                ? "Menyinkronkan..."
                : "Sync Markup Semua Variant"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">
            Sync Markup Per Game
          </p>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Gunakan saat satu game memerlukan strategi margin yang berbeda dari
            katalog global.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Pilih game
              </label>
              <select
                value={selectedGameId}
                onChange={(event) => setSelectedGameId(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              >
                <option value="">Pilih game</option>
                {games.map((game) => (
                  <option key={game._id} value={game._id}>
                    {game.name} ({game.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Markup per game (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={gameMarkup}
                onChange={(event) => setGameMarkup(event.target.value)}
                placeholder="Contoh: 8"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                syncMarkup({
                  scope: "game",
                  markup: gameMarkup,
                  gameId: selectedGameId,
                })
              }
              disabled={submittingScope !== null || games.length === 0}
              className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {submittingScope === "game"
                ? "Menyinkronkan..."
                : "Sync Markup Per Game"}
            </button>
          </div>
        </div>
      </div>

      {feedback ? (
        <div
          className={`mt-5 rounded-2xl border px-4 py-3 ${
            feedback.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <p className="text-sm font-semibold">{feedback.title}</p>
          <p className="mt-1 text-sm leading-6">{feedback.description}</p>
        </div>
      ) : null}
    </div>
  );
}
