"use client";

import { Variant } from "@/app/types/Variant";

type Props = {
  variants: Variant[];
  onEdit: (variant: Variant) => void;
  onDelete: (id: string) => void;
};

export default function VariantList({ variants, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold">List Variants</h2>

      <div className="space-y-3">
        {variants.map((variant, index) => (
          <div
            key={variant._id}
            className="flex items-center justify-between rounded-xl border p-3"
          >
            <div className="flex items-center gap-3">
              <p className="w-6 text-sm text-gray-500">{index + 1}.</p>

              {variant.logo ? (
                <img
                  src={variant.logo}
                  alt={variant.name}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : null}

              <div>
                <p className="font-medium">{variant.name}</p>
                <p className="text-xs text-gray-500">
                  {variant.game?.name || "-"} • {variant.providerCode}
                </p>
                <p className="text-xs text-gray-400">
                  {variant.currency || "IDR"} {variant.price} • Modal{" "}
                  {variant.basePrice} • {variant.markup}%
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                    {variant.status || "UNKNOWN"}
                  </span>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-600">
                    {variant.syncSource || "manual"}
                  </span>
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                    {variant.region || "ID"} • {variant.duration || 0} min
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(variant)}
                className="text-sm text-blue-600"
              >
                Edit
              </button>

              <button
                onClick={() => onDelete(variant._id)}
                className="text-sm text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
