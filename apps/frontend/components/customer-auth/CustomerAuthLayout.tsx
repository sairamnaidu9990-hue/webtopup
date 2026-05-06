"use client";

import Link from "next/link";

export default function CustomerAuthLayout({
  title,
  subtitle,
  alternateHref,
  alternateLabel,
  alternateText,
  eyebrow = "Akun KITAGG",
  showFeatureCards = true,
  showAlternateNotice = true,
  children,
}: {
  title: string;
  subtitle: string;
  alternateHref: string;
  alternateLabel: string;
  alternateText: string;
  eyebrow?: string;
  showFeatureCards?: boolean;
  showAlternateNotice?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="pb-12 pt-6 sm:pb-16 sm:pt-10">
      <div className="site-shell">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(160deg,rgba(211,59,59,0.16)_0%,rgba(17,18,23,0.96)_26%,rgba(17,18,23,0.98)_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
          <div className="grid lg:grid-cols-[0.94fr_1.06fr]">
            <div className="border-b border-white/10 px-6 py-8 sm:px-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-12">
              {eyebrow ? (
                <div className="inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-red-200">
                  {eyebrow}
                </div>
              ) : null}
              <h1
                className={`${eyebrow ? "mt-5" : ""} text-3xl font-semibold tracking-tight text-white sm:text-4xl`}
              >
                {title}
              </h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/68 sm:text-[15px]">
                {subtitle}
              </p>

              {showFeatureCards ? (
                <div className="mt-8 grid gap-3 text-sm text-white/76 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <p className="font-semibold text-white">Tetap bisa guest checkout</p>
                    <p className="mt-2 leading-6 text-white/60">
                      User tetap bisa beli dan cek transaksi tanpa wajib login.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <p className="font-semibold text-white">Keuntungan punya akun</p>
                    <p className="mt-2 leading-6 text-white/60">
                      Pantau saldo KITAGG, lihat riwayat order, dan akses dashboard user.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
              {children}

              {showAlternateNotice ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/65">
                  <span>{alternateText}</span>{" "}
                  <Link
                    href={alternateHref}
                    className="font-semibold text-red-300 transition hover:text-red-200"
                  >
                    {alternateLabel}
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
