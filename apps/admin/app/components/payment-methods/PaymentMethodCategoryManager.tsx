"use client";

import type { PaymentMethodCategory } from "@/app/types/PaymentMethod";

type Props = {
  categories: PaymentMethodCategory[];
  isOpen: boolean;
  editingId: string | null;
  success: string;
  submitting: boolean;
  name: string;
  code: string;
  order: string;
  description: string;
  isActive: boolean;
  setName: (value: string) => void;
  setCode: (value: string) => void;
  setOrder: (value: string) => void;
  setDescription: (value: string) => void;
  setIsActive: (value: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
  onOpen: () => void;
  onClose: () => void;
  onEdit: (category: PaymentMethodCategory) => void;
  onDelete: (id: string) => void;
};

export default function PaymentMethodCategoryManager({
  categories,
  isOpen,
  editingId,
  success,
  submitting,
  name,
  code,
  order,
  description,
  isActive,
  setName,
  setCode,
  setOrder,
  setDescription,
  setIsActive,
  onSubmit,
  onOpen,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const title = editingId
    ? "Perbarui Kategori Pembayaran"
    : "Kategori Pembayaran";
  const fieldClassName = "w-full rounded-xl border border-gray-200 px-4 py-2.5";
  const labelClassName = "mb-2 block text-sm font-medium text-gray-700";

  return (
    <div className="rounded-2xl border bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">
            Tambah, ubah, atur urutan, dan hapus kategori pembayaran seperti
            E-Wallet, Virtual Account, atau Convenience Store.
          </p>
        </div>

        {!isOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-xl text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-gray-800 hover:shadow-md"
            aria-label="Tampilkan form kategori pembayaran"
          >
            +
          </button>
        ) : null}
      </div>

      {success ? (
        <div className="mt-5 rounded-xl bg-green-100 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      {isOpen ? (
        <form
          onSubmit={onSubmit}
          className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <label className="block">
            <span className={labelClassName}>Nama Kategori</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: E-Wallet"
              className={fieldClassName}
              required
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Kode Kategori</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="Opsional, auto dari nama jika kosong"
              className={fieldClassName}
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Urutan</span>
            <input
              type="number"
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              placeholder="Contoh: 1"
              className={fieldClassName}
              required
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Status</span>
            <span className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Aktifkan kategori ini
            </span>
          </label>

          <label className="block sm:col-span-2 xl:col-span-4">
            <span className={labelClassName}>Deskripsi</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Deskripsi singkat kategori pembayaran"
              className="min-h-[96px] w-full rounded-xl border border-gray-200 px-4 py-3"
            />
          </label>

          <button
            disabled={submitting}
            className="w-full rounded-xl bg-black py-2 text-white disabled:opacity-50 sm:col-span-2 xl:col-span-4"
          >
            {submitting
              ? "Menyimpan..."
              : editingId
                ? "Simpan Perubahan"
                : "Tambah Kategori"}
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

      <div className="mt-5 space-y-3">
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">
            Belum ada kategori pembayaran yang tersimpan.
          </p>
        ) : null}

        {categories.map((category, index) => (
          <div
            key={category._id}
            className="flex flex-col gap-4 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <p className="w-6 shrink-0 pt-1 text-sm text-gray-500">
                {index + 1}.
              </p>

              <div className="min-w-0">
                <p className="break-words font-medium">{category.name}</p>
                <p className="text-xs text-gray-500">
                  {category.code} • Urutan {category.order}
                </p>
                {category.description ? (
                  <p className="mt-1 text-xs text-gray-400">
                    {category.description}
                  </p>
                ) : null}
                <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                  <span
                    className={`rounded-full px-2 py-1 ${
                      category.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {category.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex w-full justify-end gap-3 sm:w-auto">
              <button
                onClick={() => onEdit(category)}
                className="text-sm text-blue-600"
              >
                Ubah
              </button>

              <button
                onClick={() => onDelete(category._id)}
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
