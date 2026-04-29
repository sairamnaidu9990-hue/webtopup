"use client";

export default function MobileContentTabs({
  activeTab,
  onChange,
}: {
  activeTab: "transaction" | "detail";
  onChange: (nextTab: "transaction" | "detail") => void;
}) {
  return (
    <div className="md:hidden">
      <div className="overflow-hidden rounded-[18px] border border-white/8 bg-[#2a2a2f] p-2 shadow-[0_12px_24px_rgba(0,0,0,0.14)]">
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["transaction", "Transaksi"],
              ["detail", "Keterangan"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              className={`flex h-11 items-center justify-center rounded-[14px] px-4 text-[13px] font-semibold transition ${
                activeTab === value
                  ? "border border-[rgba(211,59,59,0.38)] bg-[linear-gradient(180deg,var(--accent-strong)_0%,var(--accent)_100%)] text-white shadow-[0_12px_24px_var(--accent-glow)]"
                  : "bg-[#32343b] text-white/72"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
