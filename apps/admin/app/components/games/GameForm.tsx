"use client";

type Props = {
  isOpen: boolean;
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
  onOpen: () => void;
  onClose: () => void;
};

export default function GameForm({
  isOpen,
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
  onOpen,
  onClose,
}: Props) {
  const title = editingId ? "Perbarui Game" : "Tambah Game";

  return (
    <div className="rounded-2xl border bg-white p-6">
      <h2 className="text-lg font-semibold">{title}</h2>

      {!isOpen ? (
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
        <form onSubmit={onSubmit} className="mt-5 grid gap-4 md:grid-cols-4">
          <input
            placeholder="Nama game"
            className="rounded-xl border px-4 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            placeholder="Kode game"
            className="rounded-xl border px-4 py-2"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />

          <input
            placeholder="Nama provider"
            className="rounded-xl border px-4 py-2"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          />

          <input
            placeholder="URL logo"
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
              ? "Menyimpan..."
              : editingId
              ? "Simpan Perubahan"
              : "Tambah Game"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="col-span-4 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          >
            Tutup Form
          </button>
        </form>
      ) : null}
    </div>
  );
}
