"use client";

type Game = {
  _id: string;
  name: string;
  code: string;
};

type Props = {
  isOpen: boolean;
  name: string;
  providerCode: string;
  basePrice: string;
  markup: string;
  logo: string;
  region: string;
  currency: string;
  duration: string;
  status: string;
  gameId: string;
  games: Game[];
  editingId: string | null;
  success: string;
  submitting: boolean;
  setName: (value: string) => void;
  setProviderCode: (value: string) => void;
  setBasePrice: (value: string) => void;
  setMarkup: (value: string) => void;
  setLogo: (value: string) => void;
  setRegion: (value: string) => void;
  setCurrency: (value: string) => void;
  setDuration: (value: string) => void;
  setStatus: (value: string) => void;
  setGameId: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onOpen: () => void;
  onClose: () => void;
};

export default function VariantForm(props: Props) {
  const previewPrice =
    Number(props.basePrice || 0) +
    (Number(props.basePrice || 0) * Number(props.markup || 0)) / 100;

  const title = props.editingId ? "Perbarui Variant" : "Tambah Variant";

  return (
    <div className="rounded-2xl border bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>

      {!props.isOpen ? (
        <button
          type="button"
          onClick={props.onOpen}
          className="mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-black text-xl text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-gray-800 hover:shadow-md"
          aria-label="Tampilkan form tambah variant"
        >
          +
        </button>
      ) : null}

      {props.success ? (
        <div className="mt-5 rounded-xl bg-green-100 px-4 py-3 text-sm text-green-700">
          {props.success}
        </div>
      ) : null}

      {props.isOpen ? (
        <form
          onSubmit={props.onSubmit}
          className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <select
            value={props.gameId}
            onChange={(event) => props.setGameId(event.target.value)}
            className="w-full rounded-xl border px-4 py-2"
            required
          >
            <option value="">Pilih Game</option>
            {props.games.map((game) => (
              <option key={game._id} value={game._id}>
                {game.name} ({game.code})
              </option>
            ))}
          </select>

          <input
            placeholder="Nama variant"
            value={props.name}
            onChange={(event) => props.setName(event.target.value)}
            className="w-full rounded-xl border px-4 py-2"
            required
          />

          <input
            placeholder="Kode provider"
            value={props.providerCode}
            onChange={(event) => props.setProviderCode(event.target.value)}
            className="w-full rounded-xl border px-4 py-2"
            required
          />

          <input
            type="number"
            placeholder="Harga modal"
            value={props.basePrice}
            onChange={(event) => props.setBasePrice(event.target.value)}
            className="w-full rounded-xl border px-4 py-2"
            required
          />

          <input
            type="number"
            placeholder="Markup (%)"
            value={props.markup}
            onChange={(event) => props.setMarkup(event.target.value)}
            className="w-full rounded-xl border px-4 py-2"
            required
          />

          <input
            placeholder="URL logo"
            value={props.logo}
            onChange={(event) => props.setLogo(event.target.value)}
            className="w-full rounded-xl border px-4 py-2"
          />

          <input
            placeholder="Region"
            value={props.region}
            onChange={(event) => props.setRegion(event.target.value.toUpperCase())}
            className="w-full rounded-xl border px-4 py-2"
            required
          />

          <input
            placeholder="Mata uang"
            value={props.currency}
            onChange={(event) => props.setCurrency(event.target.value.toUpperCase())}
            className="w-full rounded-xl border px-4 py-2"
            required
          />

          <input
            type="number"
            placeholder="Durasi (menit)"
            value={props.duration}
            onChange={(event) => props.setDuration(event.target.value)}
            className="w-full rounded-xl border px-4 py-2"
            required
          />

          <select
            value={props.status}
            onChange={(event) => props.setStatus(event.target.value)}
            className="w-full rounded-xl border px-4 py-2"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2 xl:col-span-2">
            <p className="text-sm text-gray-500">Estimasi harga jual</p>
            <p className="text-lg font-semibold text-gray-800">
              {props.currency || "IDR"} {Math.ceil(previewPrice)}
            </p>
          </div>

          <button
            disabled={props.submitting}
            className="w-full rounded-xl bg-black py-2 text-white disabled:opacity-50 sm:col-span-2 xl:col-span-4"
          >
            {props.submitting
              ? "Menyimpan..."
              : props.editingId
              ? "Simpan Perubahan"
              : "Tambah Variant"}
          </button>

          <button
            type="button"
            onClick={props.onClose}
            className="w-full rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 sm:col-span-2 xl:col-span-4"
          >
            Tutup Form
          </button>
        </form>
      ) : null}
    </div>
  );
}
