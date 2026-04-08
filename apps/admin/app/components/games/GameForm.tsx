"use client";

type Props = {
  name: string;
  code: string;
  logo: string;
  provider: string;
  status: string;
  editingId: string | null;

  setName: (v: string) => void;
  setCode: (v: string) => void;
  setLogo: (v: string) => void;
  setProvider: (v: string) => void;
  setStatus: (v: string) => void;

  onSubmit: (e: React.FormEvent) => void;
  success: string;
  submitting: boolean;
};

export default function GameForm({
  name,
  code,
  logo,
  provider,
  status,
  editingId,
  setName,
  setCode,
  setLogo,
  setProvider,
  setStatus,
  onSubmit,
  success,
  submitting,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold">
        {editingId ? "Edit Game" : "Add Game"}
      </h2>

      {/* Alert */}
      {success && (
        <div className="mb-4 rounded-xl bg-green-100 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-4">
        <input
          placeholder="Name Game"
          className="rounded-xl border px-4 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          placeholder="Code Game"
          className="rounded-xl border px-4 py-2"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />

        <input
          placeholder="Provider"
          className="rounded-xl border px-4 py-2"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        />

        <input
          placeholder="Logo URL"
          className="rounded-xl border px-4 py-2"
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border px-4 py-2"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>

        <button
          disabled={submitting}
          className="col-span-4 rounded-xl bg-black py-2 text-white disabled:opacity-50"
        >
          {submitting
            ? "Loading..."
            : editingId
            ? "Update Game"
            : "Add Game"}
        </button>
      </form>
    </div>
  );
}
