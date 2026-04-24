function SkeletonBlock({
  className,
}: {
  className: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-[24px] bg-white/[0.06] ${className}`}
    />
  );
}

export default function FrontendLoading() {
  return (
    <main className="pb-10 sm:pb-12">
      <div className="site-shell">
        <section className="pt-3 sm:pt-4">
          <SkeletonBlock className="aspect-[16/6.35] w-full sm:aspect-[16/7.8] lg:h-[490px]" />
        </section>

        <section className="pt-6 sm:pt-7 lg:pt-8">
          <div className="space-y-3">
            <SkeletonBlock className="h-5 w-36 rounded-full" />
            <SkeletonBlock className="h-4 w-72 rounded-full" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonBlock
                key={`trending-skeleton-${index}`}
                className="h-[96px] sm:h-[108px]"
              />
            ))}
          </div>
        </section>

        <section className="pt-8 sm:pt-10 lg:pt-12">
          <div className="mb-5 flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock
                key={`tab-skeleton-${index}`}
                className="h-10 w-24 rounded-full"
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <SkeletonBlock
                key={`catalog-skeleton-${index}`}
                className="aspect-[3/4.35] rounded-[20px]"
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
