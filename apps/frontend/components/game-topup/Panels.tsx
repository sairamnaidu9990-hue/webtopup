"use client";

export function StepPanel({
  number,
  title,
  children,
  className = "",
}: {
  number: number;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[18px] border border-white/8 bg-[#2a2a2f] shadow-[0_12px_24px_rgba(0,0,0,0.14)] transition-[border-color,box-shadow,transform] duration-300 ${className}`}
    >
      <div className="flex min-h-[39px] items-stretch border-b border-white/8 bg-[#474747] sm:min-h-[40px]">
        <div className="flex w-8 shrink-0 items-center justify-center bg-[var(--accent)] text-[12px] font-bold text-white sm:w-9 sm:text-[13px]">
          {number}
        </div>
        <div className="flex min-w-0 items-center px-3 sm:px-3.5">
          <h2 className="truncate text-[11px] font-semibold text-white sm:text-[12px]">
            {title}
          </h2>
        </div>
      </div>

      <div className="bg-[#2d2d31] p-3 sm:p-3.5">{children}</div>
    </section>
  );
}

export function DetailInfoPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[18px] border border-white/8 bg-[#2a2a2f] shadow-[0_12px_24px_rgba(0,0,0,0.14)]">
      <div className="flex min-h-[39px] items-stretch border-b border-white/8 bg-[#474747] sm:min-h-[40px]">
        <div className="w-8 shrink-0 bg-[var(--accent)] sm:w-9" />
        <div className="flex min-w-0 items-center px-3 sm:px-3.5">
          <h2 className="truncate text-[11px] font-semibold text-white sm:text-[12px]">
            {title}
          </h2>
        </div>
      </div>

      <div className="bg-[#2d2d31] px-4 py-4 text-[13px] leading-7 text-white/88 sm:px-5 sm:py-4 sm:text-[14px]">
        {children}
      </div>
    </section>
  );
}
