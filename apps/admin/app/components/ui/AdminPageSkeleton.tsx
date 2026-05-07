"use client";

type AdminPageSkeletonProps = {
  title?: string;
  subtitle?: string;
  statsCount?: number;
  showTable?: boolean;
  showSidebar?: boolean;
};

function PulseBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`} />;
}

export default function AdminPageSkeleton({
  title = "Memuat halaman admin",
  subtitle = "Menyiapkan data dan tampilan admin...",
  statsCount = 4,
  showTable = true,
  showSidebar = false,
}: AdminPageSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <PulseBlock className="h-10 w-72 max-w-full" />
        <PulseBlock className="h-5 w-[32rem] max-w-full" />
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: statsCount }).map((_, index) => (
          <div
            key={index}
            className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm"
          >
            <PulseBlock className="h-4 w-28" />
            <PulseBlock className="mt-5 h-9 w-24" />
            <PulseBlock className="mt-4 h-4 w-36" />
          </div>
        ))}
      </div>

      <div className={`grid gap-6 ${showSidebar ? "xl:grid-cols-[1.2fr_0.8fr]" : ""}`}>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <PulseBlock className="h-12 w-full" />
            <PulseBlock className="h-12 w-full" />
            <PulseBlock className="h-12 w-full" />
          </div>

          {showTable ? (
            <div className="mt-5 space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <PulseBlock className="h-5 w-48" />
                      <PulseBlock className="h-4 w-64 max-w-full" />
                      <PulseBlock className="h-4 w-40" />
                    </div>
                    <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-[20rem]">
                      <PulseBlock className="h-16 w-full" />
                      <PulseBlock className="h-16 w-full" />
                      <PulseBlock className="h-16 w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5"
                >
                  <PulseBlock className="h-5 w-40" />
                  <PulseBlock className="mt-4 h-4 w-full" />
                  <PulseBlock className="mt-2 h-4 w-5/6" />
                  <PulseBlock className="mt-2 h-4 w-2/3" />
                </div>
              ))}
            </div>
          )}
        </div>

        {showSidebar ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <PulseBlock className="h-5 w-40" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <PulseBlock className="h-4 w-28" />
                  <PulseBlock className="mt-3 h-4 w-full" />
                  <PulseBlock className="mt-2 h-4 w-4/5" />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
