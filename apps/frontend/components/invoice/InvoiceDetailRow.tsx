import type { ReactNode } from "react";

export default function InvoiceDetailRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: ReactNode;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-[12px] text-white/56 sm:text-[13px]">{label}</dt>
      <dd
        className={`text-right text-[12px] sm:text-[13px] ${
          emphasized ? "font-semibold text-white" : "text-white/86"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
