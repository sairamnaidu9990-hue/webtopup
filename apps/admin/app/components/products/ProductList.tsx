"use client";

import { Product } from "@/app/types/Product";

type Props = {
  products: Product[];
  onDelete: (id: string) => void;
  onEdit: (p: Product) => void;
};

export default function ProductList({ products, onDelete, onEdit }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6">
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
            className="flex items-center justify-between rounded-xl border p-3"
          >
            <div className="flex items-center gap-3">
              <p className="w-6 text-sm text-gray-500">{i + 1}.</p>

              {p.logo && (
                <img
                  src={p.logo}
                  alt={p.name}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              )}

              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">
                  {p.game?.name} • Rp {p.price}
                </p>
                <p className="text-xs text-gray-400">
                  Modal: {p.basePrice} • {p.markup}%
                </p>
              </div>
            </div>

            <div className="flex gap-2">
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
