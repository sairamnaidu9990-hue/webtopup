"use client";

type Props = {
  isOpen: boolean;
  allowCreate?: boolean;
  name: string;
  code: string;
  logo: string;
  bannerUrl: string;
  category: string;
  categoryOptions: string[];
  provider: string;
  status: string;
  isTrending: boolean;
  trendingOrder: string;
  catalogOrder: string;
  editingId: string | null;

  setName: (v: string) => void;
  setCode: (v: string) => void;
  setLogo: (v: string) => void;
  setBannerUrl: (v: string) => void;
  setCategory: (v: string) => void;
  setProvider: (v: string) => void;
  setStatus: (v: string) => void;
  setIsTrending: (v: boolean) => void;
  setTrendingOrder: (v: string) => void;
  setCatalogOrder: (v: string) => void;

  onSubmit: (e: React.FormEvent) => void;
  success: string;
  submitting: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export default function GameForm({
  isOpen,
  allowCreate = true,
  name,
  code,
  logo,
  bannerUrl,
  category,
  categoryOptions,
  provider,
  status,
  isTrending,
  trendingOrder,
  catalogOrder,
  editingId,
  setName,
  setCode,
  setLogo,
  setBannerUrl,
  setCategory,
  setProvider,
  setStatus,
  setIsTrending,
  setTrendingOrder,
  setCatalogOrder,
  onSubmit,
  success,
  submitting,
  onOpen,
  onClose,
}: Props) {
  const title = editingId ? "Perbarui Game" : "Tambah Game";

  return (
    <div className="rounded-2xl border bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>

      {!isOpen && allowCreate ? (
        <button
          type="button"
          onClick={onOpen}
          className="mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-black text-xl text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-gray-800 hover:shadow-md"
          aria-label="Tampilkan form tambah game"
        >
          +
        </button>
      ) : null}

      {success && (
        <div className="mt-5 rounded-xl bg-green-100 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {isOpen ? (
        <form
          onSubmit={onSubmit}
          className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <input
            placeholder="Nama game"
            className="w-full rounded-xl border px-4 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            placeholder="Kode game"
            className="w-full rounded-xl border px-4 py-2"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />

          <input
            placeholder="Nama provider"
            className="w-full rounded-xl border px-4 py-2"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border px-4 py-2"
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <input
            placeholder="URL logo"
            className="w-full rounded-xl border px-4 py-2"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
          />

          <input
            placeholder="URL banner game"
            className="w-full rounded-xl border px-4 py-2"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border px-4 py-2"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          <label className="flex items-center gap-3 rounded-xl border px-4 py-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isTrending}
              onChange={(e) => setIsTrending(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Masukkan ke Trending Games
          </label>

          <input
            type="number"
            placeholder="Urutan Trending"
            className="w-full rounded-xl border px-4 py-2"
            value={trendingOrder}
            onChange={(e) => setTrendingOrder(e.target.value)}
          />

          <input
            type="number"
            placeholder="Urutan All Games"
            className="w-full rounded-xl border px-4 py-2"
            value={catalogOrder}
            onChange={(e) => setCatalogOrder(e.target.value)}
          />

          <button
            disabled={submitting}
            className="w-full rounded-xl bg-black py-2 text-white disabled:opacity-50 sm:col-span-2 xl:col-span-4"
          >
            {submitting
              ? "Menyimpan..."
              : editingId
              ? "Simpan Perubahan"
              : "Tambah Game"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 sm:col-span-2 xl:col-span-4"
          >
            Tutup Form
          </button>
        </form>
      ) : null}
    </div>
  );
}
