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
  variantCategories: Array<{
    _id?: string;
    name: string;
    order: number;
  }>;
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
  setVariantCategories: (
    value: Array<{
      _id?: string;
      name: string;
      order: number;
    }>
  ) => void;

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
  variantCategories,
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
  setVariantCategories,
  onSubmit,
  success,
  submitting,
  onOpen,
  onClose,
}: Props) {
  const title = editingId ? "Perbarui Game" : "Tambah Game";
  const fieldClassName = "w-full rounded-xl border px-4 py-2.5";
  const labelClassName = "mb-2 block text-sm font-medium text-gray-700";

  const normalizedVariantCategories = variantCategories.map((category, index) => ({
    ...category,
    order: index + 1,
  }));

  const updateVariantCategory = (index: number, name: string) => {
    setVariantCategories(
      normalizedVariantCategories.map((category, categoryIndex) =>
        categoryIndex === index ? { ...category, name } : category
      )
    );
  };

  const addVariantCategory = () => {
    setVariantCategories([
      ...normalizedVariantCategories,
      {
        name: "",
        order: normalizedVariantCategories.length + 1,
      },
    ]);
  };

  const removeVariantCategory = (index: number) => {
    setVariantCategories(
      normalizedVariantCategories
        .filter((_, categoryIndex) => categoryIndex !== index)
        .map((category, categoryIndex) => ({
          ...category,
          order: categoryIndex + 1,
        }))
    );
  };

  const moveVariantCategory = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;

    if (
      nextIndex < 0 ||
      nextIndex >= normalizedVariantCategories.length
    ) {
      return;
    }

    const nextCategories = [...normalizedVariantCategories];
    const currentItem = nextCategories[index];

    nextCategories[index] = nextCategories[nextIndex];
    nextCategories[nextIndex] = currentItem;

    setVariantCategories(
      nextCategories.map((category, categoryIndex) => ({
        ...category,
        order: categoryIndex + 1,
      }))
    );
  };

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
          <label className="block">
            <span className={labelClassName}>Nama Game</span>
            <input
              placeholder="Masukkan nama game"
              className={fieldClassName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Kode Game</span>
            <input
              placeholder="Masukkan kode game"
              className={fieldClassName}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Nama Provider</span>
            <input
              placeholder="Masukkan nama provider"
              className={fieldClassName}
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Kategori Game</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={fieldClassName}
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClassName}>URL Logo Game</span>
            <input
              placeholder="Masukkan URL logo game"
              className={fieldClassName}
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
            />
          </label>

          <label className="block">
            <span className={labelClassName}>URL Banner Game</span>
            <input
              placeholder="Masukkan URL banner game"
              className={fieldClassName}
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
            />
            <span className="mt-2 block text-xs leading-6 text-gray-500">
              Rekomendasi ukuran banner halaman game: 1600 x 720 px atau lebih,
              format landscape, dengan fokus objek utama di tengah gambar.
            </span>
          </label>

          <label className="block">
            <span className={labelClassName}>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={fieldClassName}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>

          <label className="block">
            <span className={labelClassName}>Trending Games</span>
            <span className="flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isTrending}
                onChange={(e) => setIsTrending(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Masukkan game ini ke Trending Games
            </span>
          </label>

          <label className="block">
            <span className={labelClassName}>Urutan Trending</span>
            <input
              type="number"
              placeholder="Masukkan urutan trending"
              className={fieldClassName}
              value={trendingOrder}
              onChange={(e) => setTrendingOrder(e.target.value)}
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Urutan All Games</span>
            <input
              type="number"
              placeholder="Masukkan urutan all games"
              className={fieldClassName}
              value={catalogOrder}
              onChange={(e) => setCatalogOrder(e.target.value)}
            />
          </label>

          <div className="rounded-2xl border bg-gray-50 p-4 sm:col-span-2 xl:col-span-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Kategori Variant per Game
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Atur grup nominal seperti Topup Diamond, First Topup, atau
                  Special Item khusus untuk game ini.
                </p>
              </div>

              <button
                type="button"
                onClick={addVariantCategory}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-100"
              >
                Tambah Kategori
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {normalizedVariantCategories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                  Belum ada kategori variant untuk game ini.
                </div>
              ) : null}

              {normalizedVariantCategories.map((categoryItem, index) => (
                <div
                  key={categoryItem._id || `variant-category-${index}`}
                  className="grid gap-3 rounded-xl border border-gray-200 bg-white p-3 lg:grid-cols-[80px_minmax(0,1fr)_auto]"
                >
                  <div className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600">
                    Urut {index + 1}
                  </div>

                  <input
                    placeholder="Nama kategori variant"
                    className="w-full rounded-xl border px-4 py-2"
                    value={categoryItem.name}
                    onChange={(event) =>
                      updateVariantCategory(index, event.target.value)
                    }
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => moveVariantCategory(index, -1)}
                      disabled={index === 0}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Naik
                    </button>

                    <button
                      type="button"
                      onClick={() => moveVariantCategory(index, 1)}
                      disabled={index === normalizedVariantCategories.length - 1}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Turun
                    </button>

                    <button
                      type="button"
                      onClick={() => removeVariantCategory(index)}
                      className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
