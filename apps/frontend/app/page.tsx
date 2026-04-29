import Image from "next/image";
import Link from "next/link";
import PaymentMethodsMarquee from "@/components/PaymentMethodsMarquee";
import {
  getPublicPaymentMethods,
  getPublicSiteSetting,
  getStorefrontGames,
  type StorefrontGame,
} from "@/lib/siteData";
import SiteBannerCarousel from "@/components/SiteBannerCarousel";
import AllGamesSection from "@/components/AllGamesSection";

function TrendingGameCard({ game }: { game: StorefrontGame }) {
  const initials = game.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <Link
      href={`/games/${game.code.toLowerCase()}`}
      className="block rounded-[20px] border border-transparent bg-[#1a1c23] p-2.5 transition duration-300 hover:border-[#d33b3b] hover:bg-[#20232c] hover:shadow-[0_0_0_1px_rgba(211,59,59,0.22)] sm:rounded-[22px] sm:p-3 lg:rounded-[24px] lg:p-4"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4">
        {game.logo ? (
          <Image
            src={game.logo}
            alt={game.name}
            width={72}
            height={72}
            sizes="(max-width: 640px) 52px, (max-width: 1024px) 60px, 72px"
            className="h-[52px] w-[52px] rounded-[14px] object-cover ring-1 ring-white/10 sm:h-[60px] sm:w-[60px] sm:rounded-[16px] lg:h-[72px] lg:w-[72px] lg:rounded-[18px]"
          />
        ) : (
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-white/10 text-xs font-semibold tracking-[0.16em] text-white sm:h-[60px] sm:w-[60px] sm:rounded-[16px] sm:text-sm lg:h-[72px] lg:w-[72px] lg:rounded-[18px]">
            {initials || "GM"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-[family-name:var(--font-display)] text-sm font-semibold leading-tight tracking-tight text-white sm:text-[0.95rem] lg:text-[1.05rem]">
            {game.name}
          </p>
          <p className="mt-1.5 truncate text-[12px] text-white/68 sm:text-[13px] lg:mt-2 lg:text-sm">
            {game.provider || "Provider belum diatur"}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const [siteSetting, storefront, paymentMethods] = await Promise.all([
    getPublicSiteSetting(),
    getStorefrontGames(),
    getPublicPaymentMethods(),
  ]);
  const hasBanner = siteSetting.banners.some((banner) => banner.imageUrl);

  return (
    <main className="pb-10 sm:pb-12">
      <div className="site-shell">
        <SiteBannerCarousel siteSetting={siteSetting} />

        {!hasBanner ? (
          <section className="rounded-[28px] border border-white/8 bg-[#171922] px-5 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:rounded-[32px] sm:px-7 sm:py-10 lg:rounded-[34px] lg:px-10 lg:py-12">
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
        ) : null}

        <section id="trending-games" className="scroll-mt-20 pt-6 sm:scroll-mt-24 sm:pt-7 lg:pt-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-base">🔥</span>
              <p className="text-lg font-semibold uppercase tracking-[0.14em] text-white">
                Trending
              </p>
            </div>
            <p className="text-sm leading-6 text-white/88">
                Berikut adalah beberapa produk yang paling populer saat ini.
              </p>
          </div>

          {storefront.trendingGames.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-[#171922] px-6 py-10 text-center text-sm text-white/45 sm:rounded-[28px]">
              Belum ada game yang dimasukkan ke Trending Games dari panel admin.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
              {storefront.trendingGames.map((game) => (
                <TrendingGameCard key={game._id} game={game} />
              ))}
            </div>
          )}
        </section>

        <section id="all-games" className="scroll-mt-20 pt-8 sm:scroll-mt-24 sm:pt-10 lg:pt-12">
          {storefront.allGames.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-[#171922] px-6 py-10 text-center text-sm text-white/45 sm:rounded-[28px]">
              Belum ada game aktif yang tersedia untuk frontend user.
            </div>
          ) : (
            <AllGamesSection
              games={storefront.allGames}
              categories={siteSetting.gameCategories}
            />
          )}
        </section>

      </div>

      <PaymentMethodsMarquee paymentMethods={paymentMethods} />
    </main>
  );
}
