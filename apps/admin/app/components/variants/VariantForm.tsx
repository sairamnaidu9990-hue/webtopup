"use client";

type Game = {
  _id: string;
  name: string;
  code: string;
};

type Props = {
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
};

export default function VariantForm(props: Props) {
  const previewPrice =
    Number(props.basePrice || 0) +
    (Number(props.basePrice || 0) * Number(props.markup || 0)) / 100;

  return (
    <div className="rounded-2xl border bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold">
        {props.editingId ? "Edit Variant" : "Add Variant"}
      </h2>

      {props.success ? (
        <div className="mb-4 rounded-xl bg-green-100 px-4 py-3 text-sm text-green-700">
          {props.success}
        </div>
      ) : null}

      <form onSubmit={props.onSubmit} className="grid gap-4 md:grid-cols-3">
        <select
          value={props.gameId}
          onChange={(event) => props.setGameId(event.target.value)}
          className="rounded-xl border px-4 py-2"
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
          placeholder="Nama Variant"
          value={props.name}
          onChange={(event) => props.setName(event.target.value)}
          className="rounded-xl border px-4 py-2"
          required
        />

        <input
          placeholder="Provider Code"
          value={props.providerCode}
          onChange={(event) => props.setProviderCode(event.target.value)}
          className="rounded-xl border px-4 py-2"
          required
        />

        <input
          type="number"
          placeholder="Base Price"
          value={props.basePrice}
          onChange={(event) => props.setBasePrice(event.target.value)}
          className="rounded-xl border px-4 py-2"
          required
        />

        <input
          type="number"
          placeholder="Markup (%)"
          value={props.markup}
          onChange={(event) => props.setMarkup(event.target.value)}
          className="rounded-xl border px-4 py-2"
          required
        />

        <input
          placeholder="Logo URL"
          value={props.logo}
          onChange={(event) => props.setLogo(event.target.value)}
          className="rounded-xl border px-4 py-2"
        />

        <input
          placeholder="Region"
          value={props.region}
          onChange={(event) => props.setRegion(event.target.value.toUpperCase())}
          className="rounded-xl border px-4 py-2"
          required
        />

        <input
          placeholder="Currency"
          value={props.currency}
          onChange={(event) => props.setCurrency(event.target.value.toUpperCase())}
          className="rounded-xl border px-4 py-2"
          required
        />

        <input
          type="number"
          placeholder="Duration (minutes)"
          value={props.duration}
          onChange={(event) => props.setDuration(event.target.value)}
          className="rounded-xl border px-4 py-2"
          required
        />

        <div className="rounded-xl bg-gray-50 p-4 md:col-span-3">
          <p className="text-sm text-gray-500">Harga jual preview</p>
          <p className="text-lg font-semibold text-gray-800">
            {props.currency || "IDR"} {Math.ceil(previewPrice)}
          </p>
        </div>

        <select
          value={props.status}
          onChange={(event) => props.setStatus(event.target.value)}
          className="rounded-xl border px-4 py-2 md:col-span-3"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>

        <button
          disabled={props.submitting}
          className="rounded-xl bg-black py-2 text-white disabled:opacity-50 md:col-span-3"
        >
          {props.submitting
            ? "Loading..."
            : props.editingId
            ? "Update Variant"
            : "Add Variant"}
        </button>
      </form>
    </div>
  );
}
