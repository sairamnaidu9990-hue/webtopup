"use client";

import RemoteThumbnail from "@/app/components/ui/RemoteThumbnail";
import { Product } from "@/app/types/Product";

type Props = {
  products: Product[];
  onDelete: (id: string) => void;
  onEdit: (p: Product) => void;
};

export default function ProductList({ products, onDelete, onEdit }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold">Daftar Produk</h2>

      <div className="space-y-3">
        {products.length === 0 ? (
          <p className="text-sm text-gray-500">
            Belum ada data produk yang tersimpan.
          </p>
        ) : null}

        {products.map((p, i) => (
          <div
            key={p._id}
            className="flex flex-col gap-4 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <p className="w-6 shrink-0 pt-1 text-sm text-gray-500">{i + 1}.</p>

              <RemoteThumbnail
                src={p.logo}
                alt={p.name}
                fallbackText={p.name.slice(0, 1).toUpperCase()}
              />

              <div className="min-w-0">
                <p className="break-words font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">
                  {p.game?.name} • Rp {p.price}
                </p>
                <p className="text-xs text-gray-400">
                  Modal: {p.basePrice} • {p.markup}%
                </p>
              </div>
            </div>

            <div className="flex w-full justify-end gap-3 sm:w-auto">
              <button
                onClick={() => onEdit(p)}
                className="text-sm text-blue-600"
              >
                Ubah
              </button>

              <button
                onClick={() => onDelete(p._id)}
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
