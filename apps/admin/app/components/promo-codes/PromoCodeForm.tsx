"use client";

import { useMemo, useState } from "react";
import type {
  PromoCodeDiscountType,
  PromoCodeGameScope,
} from "@/app/types/PromoCode";

type PromoCodeFormProps = {
  isOpen: boolean;
  editingId: string | null;
  success: string;
  submitting: boolean;
  title: string;
  code: string;
  description: string;
  discountType: PromoCodeDiscountType;
  discountValue: string;
  minimumOrderAmount: string;
  maxDailyUses: string;
  applicableCategories: string[];
  applicableGameIds: string[];
  availableCategories: string[];
  availableGames: PromoCodeGameScope[];
  isActive: boolean;
  order: string;
  setTitle: (value: string) => void;
  setCode: (value: string) => void;
  setDescription: (value: string) => void;
  setDiscountType: (value: PromoCodeDiscountType) => void;
  setDiscountValue: (value: string) => void;
  setMinimumOrderAmount: (value: string) => void;
  setMaxDailyUses: (value: string) => void;
  setApplicableCategories: (value: string[]) => void;
  setApplicableGameIds: (value: string[]) => void;
  setIsActive: (value: boolean) => void;
  setOrder: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onOpen: () => void;
  onClose: () => void;
};

function toggleCategory(
  currentCategories: string[],
  category: string,
  onChange: (value: string[]) => void
) {
  const exists = currentCategories.includes(category);

  if (exists) {
    onChange(currentCategories.filter((item) => item !== category));
    return;
  }

  onChange([...currentCategories, category]);
}

function toggleGame(
  currentGameIds: string[],
  gameId: string,
  onChange: (value: string[]) => void
) {
  const exists = currentGameIds.includes(gameId);

  if (exists) {
    onChange(currentGameIds.filter((item) => item !== gameId));
    return;
  }

  onChange([...currentGameIds, gameId]);
}

export default function PromoCodeForm({
  isOpen,
  editingId,
  success,
  submitting,
  title,
  code,
  description,
  discountType,
  discountValue,
  minimumOrderAmount,
  maxDailyUses,
  applicableCategories,
  applicableGameIds,
  availableCategories,
  availableGames,
  isActive,
  order,
  setTitle,
  setCode,
  setDescription,
  setDiscountType,
  setDiscountValue,
  setMinimumOrderAmount,
  setMaxDailyUses,
  setApplicableCategories,
  setApplicableGameIds,
  setIsActive,
  setOrder,
  onSubmit,
  onOpen,
  onClose,
}: PromoCodeFormProps) {
  const [gameSearch, setGameSearch] = useState("");

  const filteredGames = useMemo(() => {
    const keyword = gameSearch.trim().toLowerCase();

    return availableGames.filter((game) => {
      const matchesCategory =
        applicableCategories.length === 0 ||
        applicableCategories.includes(game.category || "");
      const matchesKeyword =
        keyword.length === 0 ||
        game.name.toLowerCase().includes(keyword) ||
        game.code.toLowerCase().includes(keyword) ||
        (game.category || "").toLowerCase().includes(keyword);

      return matchesCategory && matchesKeyword;
    });
  }, [applicableCategories, availableGames, gameSearch]);

  const selectedGames = useMemo(() => {
    const selectedIdSet = new Set(applicableGameIds);

    return availableGames.filter((game) => selectedIdSet.has(game._id));
  }, [applicableGameIds, availableGames]);

  return (
    <section className="rounded-[28px] border border-[#f1d6d6] bg-white shadow-[0_20px_44px_rgba(125,19,19,0.08)]">
      <div className="flex flex-col gap-4 border-b border-[#f3e0e0] bg-[linear-gradient(135deg,#fff7f7_0%,#ffffff_100%)] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c25a5a]">
            Promo Codes
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#231919]">
            {editingId ? "Perbarui Promo" : "Tambah Promo Baru"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a6363]">
            Atur diskon tetap atau persen, minimal transaksi, kuota harian, dan
            kategori atau game mana saja yang boleh memakai kode promo.
          </p>
        </div>

        {isOpen ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#e8c9c9] px-4 text-sm font-semibold text-[#8e3a3a] transition hover:border-[#d33b3b] hover:text-[#d33b3b]"
          >
            Tutup Form
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d33b3b_0%,#a52222_100%)] px-5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(211,59,59,0.24)] transition hover:brightness-110"
          >
            Tambah Promo
          </button>
        )}
      </div>

      {isOpen ? (
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          {success ? (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#3d2424]">
                  Judul Promo
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Contoh: Promo April Hemat"
                  className="w-full rounded-2xl border border-[#ecd7d7] px-4 py-3 text-sm text-[#231919] outline-none transition focus:border-[#d33b3b]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#3d2424]">
                  Kode Promo
                </span>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="APRILHEMAT"
                  className="w-full rounded-2xl border border-[#ecd7d7] px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#231919] outline-none transition focus:border-[#d33b3b]"
                  required
                />
              </label>

              <label className="block xl:col-span-2">
                <span className="mb-2 block text-sm font-medium text-[#3d2424]">
                  Deskripsi Promo
                </span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Jelaskan syarat singkat promo ini agar tim admin mudah mengenali."
                  rows={3}
                  className="w-full rounded-2xl border border-[#ecd7d7] px-4 py-3 text-sm text-[#231919] outline-none transition focus:border-[#d33b3b]"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#3d2424]">
                  Tipe Diskon
                </span>
                <select
                  value={discountType}
                  onChange={(event) =>
                    setDiscountType(event.target.value as PromoCodeDiscountType)
                  }
                  className="w-full rounded-2xl border border-[#ecd7d7] px-4 py-3 text-sm text-[#231919] outline-none transition focus:border-[#d33b3b]"
                >
                  <option value="fixed">Potongan Tetap</option>
                  <option value="percent">Potongan Persen</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#3d2424]">
                  Nilai Diskon
                </span>
                <input
                  type="number"
                  min="0"
                  step={discountType === "percent" ? "0.01" : "1"}
                  value={discountValue}
                  onChange={(event) => setDiscountValue(event.target.value)}
                  placeholder={discountType === "percent" ? "0.70" : "5000"}
                  className="w-full rounded-2xl border border-[#ecd7d7] px-4 py-3 text-sm text-[#231919] outline-none transition focus:border-[#d33b3b]"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#3d2424]">
                  Minimal Pesanan
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={minimumOrderAmount}
                  onChange={(event) => setMinimumOrderAmount(event.target.value)}
                  placeholder="10000"
                  className="w-full rounded-2xl border border-[#ecd7d7] px-4 py-3 text-sm text-[#231919] outline-none transition focus:border-[#d33b3b]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#3d2424]">
                  Limit Harian
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={maxDailyUses}
                  onChange={(event) => setMaxDailyUses(event.target.value)}
                  placeholder="0 = tanpa batas"
                  className="w-full rounded-2xl border border-[#ecd7d7] px-4 py-3 text-sm text-[#231919] outline-none transition focus:border-[#d33b3b]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#3d2424]">
                  Urutan
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={order}
                  onChange={(event) => setOrder(event.target.value)}
                  placeholder="9999"
                  className="w-full rounded-2xl border border-[#ecd7d7] px-4 py-3 text-sm text-[#231919] outline-none transition focus:border-[#d33b3b]"
                />
              </label>
            </div>

            <div className="rounded-[24px] border border-[#f0dede] bg-[#fff9f9] p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#231919]">
                    Kategori & Game yang Bisa Pakai Promo
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[#7a6363]">
                    Pilih kategori game yang boleh memakai promo ini, lalu
                    batasi lagi ke game tertentu jika diperlukan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setApplicableCategories([]);
                    setApplicableGameIds([]);
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#ead1d1] px-4 text-xs font-semibold text-[#8e3a3a] transition hover:border-[#d33b3b] hover:text-[#d33b3b]"
                >
                  Berlaku untuk Semua Game
                </button>
              </div>

              {availableCategories.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {availableCategories.map((category) => {
                    const isChecked = applicableCategories.includes(category);

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() =>
                          toggleCategory(
                            applicableCategories,
                            category,
                            setApplicableCategories
                          )
                        }
                        className={`inline-flex items-center rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                          isChecked
                            ? "border-[#d33b3b] bg-[#d33b3b] text-white shadow-[0_10px_20px_rgba(211,59,59,0.18)]"
                            : "border-[#ead1d1] bg-white text-[#7a6363] hover:border-[#d33b3b] hover:text-[#d33b3b]"
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-[#ead1d1] bg-white px-4 py-4 text-sm text-[#7a6363]">
                  Belum ada kategori dari data game aktif.
                </div>
              )}

              <div className="mt-5 rounded-[22px] border border-[#f0dede] bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-[#231919]">
                      Filter & Pilih Game Spesifik
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-[#7a6363]">
                      Jika ada game yang dipilih, promo hanya berlaku untuk game
                      tersebut. Kosongkan jika promo cukup dibatasi per kategori.
                    </p>
                  </div>

                  <div className="w-full lg:max-w-xs">
                    <input
                      value={gameSearch}
                      onChange={(event) => setGameSearch(event.target.value)}
                      placeholder="Cari nama game atau kode"
                      className="w-full rounded-2xl border border-[#ecd7d7] px-4 py-3 text-sm text-[#231919] outline-none transition focus:border-[#d33b3b]"
                    />
                  </div>
                </div>

                {selectedGames.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c25a5a]">
                      Game Terpilih
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedGames.map((game) => (
                        <button
                          key={game._id}
                          type="button"
                          onClick={() =>
                            toggleGame(
                              applicableGameIds,
                              game._id,
                              setApplicableGameIds
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-full border border-[#d33b3b] bg-[#fff3f3] px-3 py-2 text-xs font-semibold text-[#b52b2b]"
                        >
                          <span>{game.name}</span>
                          <span className="text-[#d33b3b]">×</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {availableGames.length > 0 ? (
                  <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl border border-[#f0dede] bg-[#fffafa] p-3">
                    {filteredGames.length > 0 ? (
                      <div className="grid gap-2 md:grid-cols-2">
                        {filteredGames.map((game) => {
                          const isSelected = applicableGameIds.includes(
                            game._id
                          );

                          return (
                            <button
                              key={game._id}
                              type="button"
                              onClick={() =>
                                toggleGame(
                                  applicableGameIds,
                                  game._id,
                                  setApplicableGameIds
                                )
                              }
                              className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition ${
                                isSelected
                                  ? "border-[#d33b3b] bg-[#fff1f1] shadow-[0_12px_24px_rgba(211,59,59,0.12)]"
                                  : "border-[#ecd7d7] bg-white hover:border-[#d33b3b]"
                              }`}
                            >
                              <span className="text-sm font-semibold text-[#231919]">
                                {game.name}
                              </span>
                              <span className="mt-1 text-xs text-[#8b6b6b]">
                                {game.category || "Tanpa kategori"} ·{" "}
                                {game.code}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#ead1d1] bg-white px-4 py-4 text-sm text-[#7a6363]">
                        Tidak ada game yang cocok dengan filter kategori atau
                        pencarian saat ini.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-[#ead1d1] bg-white px-4 py-4 text-sm text-[#7a6363]">
                    Belum ada game aktif yang bisa dipilih untuk promo ini.
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-[24px] border border-[#f0dede] bg-[#fff9f9] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <label className="inline-flex items-center gap-3 text-sm font-medium text-[#3d2424]">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="h-4 w-4 rounded border-[#d9b7b7] text-[#d33b3b] focus:ring-[#d33b3b]"
                />
                Aktifkan promo ini
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d33b3b_0%,#a52222_100%)] px-5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(211,59,59,0.24)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Menyimpan..."
                  : editingId
                  ? "Simpan Perubahan Promo"
                  : "Tambah Promo"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
