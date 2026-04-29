import Link from "next/link";

import type { PublicSiteSetting } from "@/lib/siteData";
import {
  getSiteInfoPageContent,
  SITE_INFO_PAGES,
  type SiteInfoPageKey,
} from "@/lib/site-info-pages";

function renderContentBlocks(content: string) {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export default function SiteInfoPageContent({
  siteSetting,
  currentKey,
}: {
  siteSetting: PublicSiteSetting;
  currentKey: SiteInfoPageKey;
}) {
  const currentPage =
    SITE_INFO_PAGES.find((item) => item.key === currentKey) || SITE_INFO_PAGES[0];
  const content = getSiteInfoPageContent(siteSetting, currentKey);
  const blocks = renderContentBlocks(content);

  return (
    <main className="site-shell py-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
        <aside className="self-start rounded-[22px] border border-white/8 bg-[#1d2027] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.16)] lg:sticky lg:top-[104px]">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-soft)]">
            Informasi
          </p>

          <div className="mt-5 space-y-2">
            {SITE_INFO_PAGES.map((item) => {
              const isActive = item.key === currentKey;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`block rounded-[14px] px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-[rgba(211,59,59,0.16)] text-white shadow-[0_0_0_1px_rgba(211,59,59,0.2)]"
                      : "text-white/78 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {item.title}
                </Link>
              );
            })}
          </div>
        </aside>

        <section className="overflow-hidden rounded-[24px] border border-white/8 bg-[#1d2027] shadow-[0_18px_42px_rgba(0,0,0,0.16)]">
          <div className="border-b border-white/8 bg-[linear-gradient(180deg,rgba(211,59,59,0.18)_0%,rgba(211,59,59,0.06)_100%)] px-5 py-5 sm:px-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--accent-soft)]">
              Halaman Informasi
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[1.9rem] font-bold tracking-tight text-white sm:text-[2.2rem]">
              {currentPage.title}
            </h1>
            <p className="mt-2 text-sm leading-7 text-white/62 sm:text-[15px]">
              Informasi ini dikelola langsung dari panel admin dan tampil otomatis
              di storefront.
            </p>
          </div>

          <div className="px-5 py-5 sm:px-6 sm:py-6">
            {blocks.length > 0 ? (
              <div className="space-y-5 text-[14px] leading-8 text-white/84 sm:text-[15px]">
                {blocks.map((block, index) => (
                  <p key={`${currentPage.key}-${index}`} className="whitespace-pre-line">
                    {block}
                  </p>
                ))}
              </div>
            ) : (
              <div className="rounded-[18px] border border-dashed border-white/10 bg-[#242730] px-4 py-6 text-sm leading-7 text-white/58">
                Konten untuk halaman <span className="font-semibold text-white/84">{currentPage.title}</span> belum diatur dari admin.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
