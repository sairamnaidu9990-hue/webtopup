import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GameTopupPanel from "@/components/GameTopupPanel";
import GameEntryPopup from "@/components/GameEntryPopup";
import {
  getPublicPaymentMethods,
  getPublicSiteSetting,
  getStorefrontGameDetail,
} from "@/lib/siteData";

function buildGameSeoTitle(gameName: string, siteName: string) {
  return `Top Up ${gameName} Murah & Cepat 24 Jam | ${siteName}`;
}

function buildGameSeoDescription({
  gameName,
  provider,
  siteName,
}: {
  gameName: string;
  provider?: string;
  siteName: string;
}) {
  const providerText = provider
    ? ` Didukung provider ${provider} dengan proses yang tetap cepat dan stabil.`
    : "";

  return `Top up ${gameName} murah, cepat, dan aman di ${siteName}. Nikmati transaksi realtime, pilihan pembayaran lengkap, dan layanan 24 jam untuk kebutuhan ${gameName} kamu.${providerText}`;
}

function buildGameSeoKeywords({
  gameName,
  provider,
  siteName,
}: {
  gameName: string;
  provider?: string;
  siteName: string;
}) {
  return [
    `top up ${gameName}`,
    `${gameName} murah`,
    `${gameName} cepat`,
    `${gameName} aman`,
    `beli ${gameName}`,
    `${gameName} 24 jam`,
    provider ? `${gameName} ${provider}` : "",
    `${siteName} ${gameName}`,
  ].filter(Boolean);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const [{ code }, siteSetting] = await Promise.all([
    params,
    getPublicSiteSetting(),
  ]);

  if (siteSetting.maintenanceModeEnabled) {
    return {
      title: `${siteSetting.siteName} Sedang Maintenance`,
      description: siteSetting.maintenanceMessage,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const detail = await getStorefrontGameDetail(code);

  if (!detail) {
    return {
      title: `Top Up Game Tidak Ditemukan | ${siteSetting.siteName}`,
      description: `Halaman game yang kamu cari tidak ditemukan di ${siteSetting.siteName}. Coba pilih game lain yang tersedia di katalog top up kami.`,
    };
  }

  const gameCode = String(detail.game.code || code).trim().toLowerCase();
  const seoTitle = buildGameSeoTitle(detail.game.name, siteSetting.siteName);
  const seoDescription = buildGameSeoDescription({
    gameName: detail.game.name,
    provider: detail.game.provider,
    siteName: siteSetting.siteName,
  });
  const seoKeywords = buildGameSeoKeywords({
    gameName: detail.game.name,
    provider: detail.game.provider,
    siteName: siteSetting.siteName,
  });

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    alternates: {
      canonical: `/games/${gameCode}`,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type: "website",
      ...(detail.game.bannerUrl || detail.game.logo
        ? {
            images: [
              {
                url: detail.game.bannerUrl || detail.game.logo || "",
                alt: detail.game.name,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      ...(detail.game.bannerUrl || detail.game.logo
        ? {
            images: [detail.game.bannerUrl || detail.game.logo || ""],
          }
        : {}),
    },
  };
}

export default async function GameVariantsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const [detail, paymentMethods] = await Promise.all([
    getStorefrontGameDetail(code),
    getPublicPaymentMethods(),
  ]);

  if (!detail) {
    notFound();
  }

  const { game, variants } = detail;
  const heroBanner = game.bannerUrl || game.logo || "";
  const heroPoster = game.logo || game.bannerUrl || "";

  return (
    <main className="pb-10 sm:pb-12">
      <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#171922]">
        <div className="relative min-h-[180px] overflow-hidden bg-[#12141b] sm:min-h-[220px] lg:min-h-[300px]">
          {heroBanner ? (
            <Image
              src={heroBanner}
              alt={game.name}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center brightness-[1.06] saturate-[1.08]"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(211,59,59,0.24),transparent_36%),linear-gradient(180deg,#1d2129_0%,#12151c_100%)]" />
          )}

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,14,0.02)_0%,rgba(8,10,14,0.06)_58%,rgba(10,12,16,0.24)_100%)]" />
        </div>

        <div className="relative bg-[linear-gradient(135deg,#1f2127_0%,#1b1d24_52%,#23252d_100%)] px-4 pb-2 pt-0 sm:px-6 sm:pb-3 lg:px-8 lg:pb-4">
          <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(125deg,transparent_0%,transparent_34%,rgba(255,255,255,0.04)_34%,rgba(255,255,255,0.04)_42%,transparent_42%,transparent_56%,rgba(255,255,255,0.03)_56%,rgba(255,255,255,0.03)_65%,transparent_65%)]" />

          <div className="site-shell relative pb-2 pt-4 sm:pb-2 sm:pt-5 lg:pb-2 lg:pt-6">
            <div className="relative">
              <div className="flex items-end gap-4 sm:gap-5 lg:gap-7">
              <div className="-mt-14 w-[108px] shrink-0 sm:-mt-16 sm:w-[128px] lg:-mt-[88px] lg:w-[154px]">
                <div className="overflow-hidden rounded-[22px] bg-[#10131a] shadow-[0_18px_36px_rgba(0,0,0,0.3)]">
                  {heroPoster ? (
                    <Image
                      src={heroPoster}
                      alt={game.name}
                      width={154}
                      height={182}
                      sizes="(max-width: 640px) 108px, (max-width: 1024px) 128px, 154px"
                      className="aspect-[4/4.72] w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex aspect-[4/4.72] w-full items-center justify-center bg-white/8 text-4xl font-semibold tracking-[0.18em] text-white/82">
                      {game.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

                <div className="relative min-w-0 flex-1 pb-1 lg:pb-2">
                <h1 className="font-[family-name:var(--font-display)] text-[1.18rem] font-bold leading-none tracking-tight text-white sm:text-[1.45rem] lg:text-[2rem]">
                  {game.name}
                </h1>
                <p className="mt-1.5 text-[13px] font-medium text-[#ffb36b] sm:mt-2 sm:text-[14px] lg:text-base">
                  {game.provider || "Provider Game"}
                </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] font-medium text-white/84 sm:text-[12px] lg:ml-[182px] lg:justify-start lg:gap-x-5">
                <span className="inline-flex items-center gap-2">
                  <span className="text-xs text-[#ffd15c] sm:text-sm">⚡</span>
                  Proses Cepat
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="text-xs text-[#8f8cff] sm:text-sm">•</span>
                  Layanan 24/7
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="text-xs text-[#6ca0ff] sm:text-sm">•</span>
                  Pembayaran Aman
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      <GameTopupPanel
        game={game}
        variants={variants}
        paymentMethods={paymentMethods}
      />
      <GameEntryPopup game={game} />
    </main>
  );
}
