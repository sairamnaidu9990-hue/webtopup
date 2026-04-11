import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublicSiteSetting,
  getStorefrontGameDetail,
  type StorefrontVariant,
} from "@/lib/siteData";

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency || "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency || "IDR"} ${value}`;
  }
}

function getVariantLogo(variant: StorefrontVariant, fallbackLogo: string) {
  return variant.logo || fallbackLogo || "";
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
  const detail = await getStorefrontGameDetail(code);

  if (!detail) {
    return {
      title: `Game tidak ditemukan | ${siteSetting.siteName}`,
    };
  }

  return {
    title: `${detail.game.name} | ${siteSetting.siteName}`,
    description:
      detail.game.provider
        ? `Pilih variant top up ${detail.game.name} dari provider ${detail.game.provider}.`
        : `Pilih variant top up ${detail.game.name}.`,
    openGraph: detail.game.bannerUrl || detail.game.logo
      ? {
          images: [
            {
              url: detail.game.bannerUrl || detail.game.logo || "",
              alt: detail.game.name,
            },
          ],
        }
      : undefined,
  };
}

export default async function GameVariantsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const detail = await getStorefrontGameDetail(code);

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
            <img
              src={heroBanner}
              alt={game.name}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(211,59,59,0.24),transparent_36%),linear-gradient(180deg,#1d2129_0%,#12151c_100%)]" />
          )}

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,14,0.06)_0%,rgba(8,10,14,0.18)_62%,rgba(10,12,16,0.56)_100%)]" />
        </div>

        <div className="relative bg-[linear-gradient(135deg,#1f2127_0%,#1b1d24_52%,#23252d_100%)] px-4 pb-2 pt-0 sm:px-6 sm:pb-3 lg:px-8 lg:pb-4">
          <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(125deg,transparent_0%,transparent_34%,rgba(255,255,255,0.04)_34%,rgba(255,255,255,0.04)_42%,transparent_42%,transparent_56%,rgba(255,255,255,0.03)_56%,rgba(255,255,255,0.03)_65%,transparent_65%)]" />

          <div className="site-shell relative pb-2 pt-4 sm:pb-2 sm:pt-5 lg:pb-2 lg:pt-6">
            <div className="relative">
              <div className="flex items-end gap-4 sm:gap-5 lg:gap-7">
              <div className="-mt-14 w-[108px] shrink-0 sm:-mt-16 sm:w-[128px] lg:-mt-[88px] lg:w-[154px]">
                <div className="overflow-hidden rounded-[22px] bg-[#10131a] shadow-[0_18px_36px_rgba(0,0,0,0.3)]">
                  {heroPoster ? (
                    <img
                      src={heroPoster}
                      alt={game.name}
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

            {game.inputs.length > 0 ? (
              <div className="relative mt-5 rounded-[22px] border border-white/8 bg-[#11141b] px-4 py-4 sm:mt-6 sm:px-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/52">
                  Input Yang Dibutuhkan
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {game.inputs.map((input) => (
                    <span
                      key={`${input.name}-${input.title}`}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/78"
                    >
                      {input.title || input.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="site-shell pt-8 sm:pt-10">
        <section>
          <div className="space-y-1.5">
            <p className="text-lg font-semibold uppercase tracking-[0.14em] text-white">
              Variant
            </p>
            <p className="text-sm leading-6 text-white/84">
              Berikut daftar variant aktif untuk {game.name}.
            </p>
          </div>

          {variants.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-[#171922] px-6 py-10 text-center text-sm text-white/45">
              Belum ada variant aktif untuk game ini.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              {variants.map((variant) => {
                const variantLogo = getVariantLogo(variant, game.logo || "");

                return (
                  <article
                    key={variant._id}
                    className="overflow-hidden rounded-[24px] border border-white/8 bg-[#171922] transition hover:border-[#d33b3b] hover:shadow-[0_0_0_1px_rgba(211,59,59,0.18)]"
                  >
                    <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
                      {variantLogo ? (
                        <img
                          src={variantLogo}
                          alt={variant.name}
                          className="h-16 w-16 shrink-0 rounded-[18px] object-cover object-center ring-1 ring-white/10 sm:h-[72px] sm:w-[72px]"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-white/10 text-sm font-semibold tracking-[0.16em] text-white/84 ring-1 ring-white/10 sm:h-[72px] sm:w-[72px]">
                          {game.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff8552]">
                          {variant.currency || "IDR"}
                        </p>
                        <h2 className="mt-2 line-clamp-2 font-[family-name:var(--font-display)] text-lg font-semibold leading-tight text-white">
                          {variant.name}
                        </h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/72">
                            {variant.region || "ID"}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/72">
                            {variant.duration > 0
                              ? `${variant.duration} min`
                              : "Instant"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/8 bg-[#14171d] px-4 py-4 sm:px-5">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                        Harga
                      </p>
                      <p className="mt-2 text-xl font-semibold text-white">
                        {formatCurrency(variant.price, variant.currency)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
