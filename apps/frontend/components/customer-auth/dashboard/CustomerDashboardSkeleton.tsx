export default function CustomerDashboardSkeleton() {
  return (
    <main className="pb-12 pt-6 sm:pb-16 sm:pt-10">
      <div className="site-shell space-y-6">
        <section className="rounded-[30px] border border-white/10 bg-white/[0.03] px-6 py-8 shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
          <div className="animate-pulse space-y-5">
            <div className="h-7 w-32 rounded-full bg-white/10" />
            <div className="h-12 w-72 max-w-full rounded-2xl bg-white/10" />
            <div className="h-5 w-[30rem] max-w-full rounded-2xl bg-white/10" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4"
                >
                  <div className="h-4 w-24 rounded-xl bg-white/10" />
                  <div className="mt-4 h-7 w-32 rounded-xl bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-6"
            >
              <div className="animate-pulse space-y-4">
                <div className="h-8 w-44 rounded-2xl bg-white/10" />
                <div className="h-5 w-72 max-w-full rounded-2xl bg-white/10" />
                {Array.from({ length: 4 }).map((__, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="h-16 rounded-3xl border border-white/10 bg-white/[0.04]"
                  />
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-52 rounded-2xl bg-white/10" />
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 rounded-3xl border border-white/10 bg-white/[0.04]"
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
