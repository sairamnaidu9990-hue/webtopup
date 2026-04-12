"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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

export default function SiteHeader({
  siteSetting,
}: {
  siteSetting: PublicSiteSetting;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[rgba(17,18,23,0.88)] shadow-[0_14px_40px_rgba(0,0,0,0.22)]"
          : "bg-transparent"
      }`}
    >
      <div className="site-shell flex items-center justify-between py-2.5 sm:py-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          {siteSetting.siteLogoUrl ? (
            <Image
              src={siteSetting.siteLogoUrl}
              alt={siteSetting.siteName}
              width={44}
              height={44}
              sizes="(max-width: 640px) 36px, 44px"
              className="h-9 w-9 rounded-2xl object-cover ring-1 ring-white/10 sm:h-11 sm:w-11"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-xs font-semibold tracking-[0.18em] text-white ring-1 ring-white/10 sm:h-11 sm:w-11 sm:text-sm sm:tracking-[0.2em]">
              {getInitials(siteSetting.siteName || "WT") || "WT"}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight text-white sm:text-lg">
              {siteSetting.siteName}
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-white/65 md:flex lg:gap-6">
          <Link href="/#trending-games" className="transition hover:text-white">
            Trending Games
          </Link>
          <Link href="/#all-games" className="transition hover:text-white">
            All Games
          </Link>
        </nav>
      </div>
    </header>
  );
}
