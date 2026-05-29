"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { PublicSiteSetting } from "@/lib/siteData";
import CustomerAuthActions from "@/components/customer-auth/CustomerAuthActions";
import MobileMenu from "@/components/site-header/MobileMenu";
import SearchResults from "@/components/site-header/SearchResults";
import {
  HamburgerIcon,
  HeaderIconButton,
  isNavigationItemActive,
  navigationItems,
  SearchIcon,
  getInitials,
  type SearchGameItem,
} from "@/components/site-header/shared";

export default function SiteHeader({
  siteSetting,
}: {
  siteSetting: PublicSiteSetting;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchGameItem[]>([]);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const desktopSearchRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchRef = useRef<HTMLDivElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const pathname = usePathname();
  const normalizedPathname = String(pathname || "");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setDesktopSearchOpen(false);
    setMobileSearchOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!desktopSearchRef.current?.contains(target)) {
        setDesktopSearchOpen(false);
      }

      if (!headerRef.current?.contains(target)) {
        setMobileSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (mobileSearchOpen) {
      window.setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 40);
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    const shouldSearch = desktopSearchOpen || mobileSearchOpen;

    if (!shouldSearch || normalizedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/storefront/games/search?q=${encodeURIComponent(
            normalizedQuery
          )}&limit=8`,
          {
            signal: controller.signal,
          }
        );
        const payload = await response.json().catch(() => ({ items: [] }));

        if (!response.ok) {
          throw new Error("Failed to search games");
        }

        setResults(Array.isArray(payload.items) ? payload.items : []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query, desktopSearchOpen, mobileSearchOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[rgba(17,18,23,0.94)] shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl"
            : "bg-[rgba(17,18,23,0.78)] backdrop-blur-lg"
        }`}
      >
        <div ref={headerRef} className="site-shell relative">
          <div className="flex items-center justify-between gap-3 py-2.5 sm:py-4 md:gap-5 md:py-3.5">
            <Link
              href="/"
              aria-label={siteSetting.siteName}
              className="flex min-w-0 shrink-0 items-center"
            >
              {siteSetting.siteLogoUrl ? (
                <div className="relative h-9 w-[92px] sm:h-11 sm:w-[120px]">
                  <Image
                    src={siteSetting.siteLogoUrl}
                    alt={siteSetting.siteName}
                    fill
                    sizes="(max-width: 640px) 92px, 120px"
                    className="object-contain object-left"
                  />
                </div>
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-xs font-semibold tracking-[0.18em] text-white ring-1 ring-white/10 sm:h-11 sm:w-11 sm:text-sm sm:tracking-[0.2em]">
                  {getInitials(siteSetting.siteName || "WT") || "WT"}
                </div>
              )}
              <span className="sr-only">{siteSetting.siteName}</span>
            </Link>

            <div
              ref={desktopSearchRef}
              className="relative hidden min-w-0 flex-1 md:block"
            >
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onFocus={() => setDesktopSearchOpen(true)}
                  placeholder="Cari game atau voucher"
                  className="h-10 w-full rounded-full border border-white/10 bg-[#2a2d34] px-4 pr-11 text-base text-white outline-none transition placeholder:text-white/35 focus:border-[#d33b3b]/45 focus:bg-[#30333b] focus:shadow-[0_0_0_3px_rgba(211,59,59,0.12)] lg:h-11 lg:px-5 lg:text-[15px]"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/45">
                  <SearchIcon />
                </span>
              </div>

              {desktopSearchOpen ? (
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] shadow-[0_22px_60px_rgba(0,0,0,0.34)]">
                  <SearchResults
                    query={query}
                    loading={loading}
                    results={results}
                    onSelect={() => setDesktopSearchOpen(false)}
                  />
                </div>
              ) : null}
            </div>

            <div className="hidden shrink-0 items-center gap-3 md:flex">
              <CustomerAuthActions />
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <HeaderIconButton
                label="Buka pencarian"
                active={mobileSearchOpen}
                onClick={() => {
                  setMenuOpen(false);
                  setMobileSearchOpen((current) => !current);
                }}
              >
                <SearchIcon />
              </HeaderIconButton>

              <HeaderIconButton
                label="Buka menu"
                active={menuOpen}
                onClick={() => {
                  setMobileSearchOpen(false);
                  setMenuOpen(true);
                }}
              >
                <HamburgerIcon />
              </HeaderIconButton>
            </div>
          </div>

          {mobileSearchOpen ? (
            <div
              ref={mobileSearchRef}
              className="pb-3 md:hidden"
            >
              <div className="rounded-[24px] border border-white/10 bg-[#171a21] p-3 shadow-[0_22px_60px_rgba(0,0,0,0.34)]">
                <div className="relative">
                  <input
                    ref={mobileInputRef}
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari game atau voucher"
                    className="h-11 w-full rounded-2xl border border-white/10 bg-[#2a2d34] px-4 pr-11 text-base text-white outline-none transition placeholder:text-white/35 focus:border-[#d33b3b]/45 focus:bg-[#30333b] focus:shadow-[0_0_0_3px_rgba(211,59,59,0.12)]"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/45">
                    <SearchIcon />
                  </span>
                </div>

                <div className="mt-3">
                  <SearchResults
                    query={query}
                    loading={loading}
                    results={results}
                    onSelect={() => setMobileSearchOpen(false)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="hidden border-t border-white/8 md:flex md:items-center md:justify-between md:gap-6 md:pb-2 md:pt-2.5">
            <nav className="flex min-w-0 items-center gap-4 overflow-x-auto text-sm">
              {navigationItems.map((item) => {
                const isActive = isNavigationItemActive(normalizedPathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-0.5 pb-2 pt-1 font-semibold transition ${
                      isActive
                        ? "border-[#d33b3b] text-[#ff6f6f]"
                        : "border-transparent text-white/72 hover:border-[#d33b3b]/60 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="shrink-0 text-xs font-medium text-white/35">
              Temukan game, voucher, dan artikel lebih cepat.
            </div>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        siteSetting={siteSetting}
        onClose={() => setMenuOpen(false)}
      />
    </>
  );
}
