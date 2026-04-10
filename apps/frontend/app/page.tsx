import { getPublicSiteSetting, getStorefrontGames, type StorefrontGame } from "@/lib/siteData";

function GameCard({ game }: { game: StorefrontGame }) {
  const initials = game.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <article className="rounded-[28px] border border-white/8 bg-[#1a1d27] p-4 transition duration-300 hover:-translate-y-1 hover:border-white/12 hover:bg-[#202431] hover:shadow-[0_18px_40px_rgba(0,0,0,0.24)] sm:p-5">
      <div className="flex items-start gap-4">
        {game.logo ? (
          <img
            src={game.logo}
            alt={game.name}
            className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold tracking-[0.18em] text-white">
            {initials || "GM"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-white">
            {game.name}
          </p>
          <p className="mt-1 truncate text-sm text-white/50">
            {game.provider || "Provider belum diatur"}{" "}
            {game.code ? `• ${game.code}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-medium">
        {game.isTrending ? (
          <span className="rounded-full bg-[#3b2413] px-3 py-1 text-[#ffbf7c]">
            Trending #{game.trendingOrder ?? 9999}
          </span>
        ) : null}
        <span className="rounded-full bg-white/8 px-3 py-1 text-white/65">
          All Games #{game.catalogOrder ?? 9999}
        </span>
        <span className="rounded-full bg-[#1f334a] px-3 py-1 text-[#96c2ff]">
          {game.syncSource || "manual"}
        </span>
      </div>
    </article>
  );
}

export default async function HomePage() {
  const [siteSetting, storefront] = await Promise.all([
    getPublicSiteSetting(),
    getStorefrontGames(),
  ]);

  return (
    <main className="px-4 pb-10 sm:px-6 sm:pb-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[34px] border border-white/8 bg-[#171922] px-5 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:px-7 sm:py-10 lg:px-10 lg:py-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/45">
              {siteSetting.siteName}
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {siteSetting.siteTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">
              {siteSetting.siteDescription}
            </p>
          </div>
        </section>

        <section id="trending-games" className="pt-10 sm:pt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/45">
                Trending Games
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Game unggulan yang sedang ditonjolkan.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/50 sm:text-right">
              Section ini hanya membaca game yang ditandai trending dari panel admin dan otomatis mengikuti urutannya.
            </p>
          </div>

          {storefront.trendingGames.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-white/10 bg-[#171922] px-6 py-10 text-center text-sm text-white/45">
              Belum ada game yang dimasukkan ke Trending Games dari panel admin.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {storefront.trendingGames.map((game) => (
                <GameCard key={game._id} game={game} />
              ))}
            </div>
          )}
        </section>

        <section id="all-games" className="pt-10 sm:pt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/45">
                All Games
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Semua game aktif yang siap tampil ke user.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/50 sm:text-right">
              Katalog mengikuti urutan `All Games` dari admin panel, jadi game bisa diatur tampil dari urutan pertama sampai seterusnya.
            </p>
          </div>

          {storefront.allGames.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-white/10 bg-[#171922] px-6 py-10 text-center text-sm text-white/45">
              Belum ada game aktif yang tersedia untuk frontend user.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {storefront.allGames.map((game) => (
                <GameCard key={game._id} game={game} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
