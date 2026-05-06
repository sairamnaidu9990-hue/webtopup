"use client";

import Image from "next/image";
import Link from "next/link";

import CustomerAuthActions from "@/components/customer-auth/CustomerAuthActions";
import type { PublicSiteSetting } from "@/lib/siteData";
import { getInitials } from "@/components/site-header/shared";

export default function MobileMenu({
  open,
  siteSetting,
  onClose,
}: {
  open: boolean;
  siteSetting: PublicSiteSetting;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] md:hidden">
      <button
        type="button"
        aria-label="Tutup menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/55"
      />

      <aside className="absolute left-0 top-0 flex h-full w-[280px] flex-col border-r border-white/10 bg-[#15181f] shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div className="min-w-0">
            {siteSetting.siteLogoUrl ? (
              <div className="relative h-9 w-[96px]">
                <Image
                  src={siteSetting.siteLogoUrl}
                  alt={siteSetting.siteName}
                  fill
                  sizes="96px"
                  className="object-contain object-left"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-xs font-semibold tracking-[0.18em] text-white ring-1 ring-white/10">
                {getInitials(siteSetting.siteName || "WT") || "WT"}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-white/72 transition hover:border-white/18 hover:text-white"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <Link
            href="/"
            onClick={onClose}
            className="block rounded-2xl px-4 py-3 text-sm font-medium text-white/88 transition hover:bg-white/5 hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/reviews"
            onClick={onClose}
            className="block rounded-2xl px-4 py-3 text-sm font-medium text-white/88 transition hover:bg-white/5 hover:text-white"
          >
            Ulasan
          </Link>
          <Link
            href="/cek-transaksi"
            onClick={onClose}
            className="block w-full rounded-2xl bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-4 py-3 text-left text-sm font-semibold text-white shadow-[0_14px_28px_rgba(211,59,59,0.2)] transition hover:brightness-110"
          >
            Cek Transaksi
          </Link>

          <div className="pt-2">
            <CustomerAuthActions mobile onNavigate={onClose} />
          </div>
        </nav>
      </aside>
    </div>
  );
}
