import Image from "next/image";
import type { PublicSiteSetting } from "@/lib/siteData";

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function FrontendMaintenanceScreen({
  siteSetting,
}: {
  siteSetting: PublicSiteSetting;
}) {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-[#111217] px-4 py-10 text-white sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(211,59,59,0.16),transparent_34%),linear-gradient(180deg,#111217_0%,#141720_48%,#101217_100%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(120deg,transparent_0%,transparent_38%,rgba(255,255,255,0.03)_38%,rgba(255,255,255,0.03)_42%,transparent_42%,transparent_100%)]" />

      <div className="site-shell relative">
        <section className="mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-white/8 bg-[linear-gradient(145deg,rgba(27,29,36,0.96)_0%,rgba(20,22,27,0.98)_100%)] px-6 py-8 shadow-[0_28px_80px_rgba(0,0,0,0.36)] sm:px-8 sm:py-10">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--accent-soft)]">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_0_6px_var(--accent-glow)]" />
              Maintenance Mode
            </div>

            <div className="mt-6 flex justify-center">
              {siteSetting.siteLogoUrl ? (
                <Image
                  src={siteSetting.siteLogoUrl}
                  alt={siteSetting.siteName}
                  width={88}
                  height={88}
                  sizes="88px"
                  className="h-22 w-22 rounded-[24px] object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="flex h-[88px] w-[88px] items-center justify-center rounded-[24px] bg-white/8 text-xl font-semibold tracking-[0.2em] text-white ring-1 ring-white/10">
                  {getInitials(siteSetting.siteName || "WT") || "WT"}
                </div>
              )}
            </div>

            <p className="mt-5 text-sm font-medium uppercase tracking-[0.18em] text-white/45">
              {siteSetting.siteName}
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[2rem] font-bold tracking-tight text-white sm:text-[2.6rem]">
              {siteSetting.maintenanceTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/72 sm:text-base">
              {siteSetting.maintenanceMessage}
            </p>

            <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
              <div className="rounded-[20px] border border-white/8 bg-white/5 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                  Status
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  Sementara Tidak Tersedia
                </p>
              </div>

              <div className="rounded-[20px] border border-white/8 bg-white/5 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                  Tujuan
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  Peningkatan Stabilitas Layanan
                </p>
              </div>

              <div className="rounded-[20px] border border-white/8 bg-white/5 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                  Bantuan
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  Gunakan tombol kontak jika perlu bantuan cepat
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
