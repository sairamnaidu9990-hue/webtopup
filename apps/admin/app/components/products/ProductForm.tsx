"use client";

type Game = {
  _id: string;
  name: string;
};

type Props = {
  name: string;
  basePrice: string;
  markup: string;
  providerCode: string;
  logo: string;
  gameId: string;
  games: Game[];

  setName: (v: string) => void;
  setBasePrice: (v: string) => void;
  setMarkup: (v: string) => void;
  setProviderCode: (v: string) => void;
  setLogo: (v: string) => void;
  setGameId: (v: string) => void;

  onSubmit: (e: React.FormEvent) => void;
  editingId: string | null;
  submitting: boolean;
  success: string;
};

export default function ProductForm(props: Props) {
  const previewPrice =
    Number(props.basePrice || 0) +
    (Number(props.basePrice || 0) * Number(props.markup || 0)) / 100;

  const profit = previewPrice - Number(props.basePrice || 0);

  return (
    <div className="rounded-2xl border bg-white p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold">
        {props.editingId ? "Perbarui Produk" : "Tambah Produk"}
      </h2>

      {props.success && (
        <div className="mb-4 rounded-xl bg-green-100 px-4 py-3 text-sm text-green-700">
          {props.success}
        </div>
      )}

      <form
        onSubmit={props.onSubmit}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <input
          placeholder="Nama Product"
          value={props.name}
          onChange={(e) => props.setName(e.target.value)}
          className="w-full rounded-xl border px-4 py-2"
          required
        />

        <input
          type="number"
          placeholder="Harga modal"
          value={props.basePrice}
          onChange={(e) => props.setBasePrice(e.target.value)}
          className="w-full rounded-xl border px-4 py-2"
          required
        />

        <input
          type="number"
          placeholder="Markup (%)"
          value={props.markup}
          onChange={(e) => props.setMarkup(e.target.value)}
          className="w-full rounded-xl border px-4 py-2"
          required
        />

        {/* 🔥 PREVIEW */}
        <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2 xl:col-span-3">
          <p className="text-sm text-gray-500">Estimasi harga jual</p>
          <p className="text-lg font-semibold text-gray-800">
            Rp {Math.ceil(previewPrice)}
          </p>
          <p className="text-xs text-green-600">
            Profit: Rp {Math.ceil(profit)}
          </p>
        </div>

        <input
          placeholder="Kode provider"
          value={props.providerCode}
          onChange={(e) => props.setProviderCode(e.target.value)}
          className="w-full rounded-xl border px-4 py-2"
        />

        <input
          placeholder="URL logo"
          value={props.logo}
          onChange={(e) => props.setLogo(e.target.value)}
          className="w-full rounded-xl border px-4 py-2"
        />

        <select
          value={props.gameId}
          onChange={(e) => props.setGameId(e.target.value)}
          className="w-full rounded-xl border px-4 py-2"
          required
        >
          <option value="">Pilih Game</option>
          {props.games.map((g) => (
            <option key={g._id} value={g._id}>
              {g.name}
            </option>
          ))}
        </select>

        <button
          disabled={props.submitting}
          className="w-full rounded-xl bg-black py-2 text-white disabled:opacity-50 sm:col-span-2 xl:col-span-3"
        >
          {props.submitting
            ? "Menyimpan..."
            : props.editingId
            ? "Simpan Perubahan"
            : "Tambah Produk"}
        </button>
      </form>
    </div>
  );
}
