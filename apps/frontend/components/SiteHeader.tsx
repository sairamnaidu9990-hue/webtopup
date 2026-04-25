"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { PublicSiteSetting } from "@/lib/siteData";

type SearchGameItem = {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  provider?: string;
  category?: string;
};

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlightedText(value: string, query: string) {
  const normalizedValue = String(value || "");
  const normalizedQuery = String(query || "").trim();

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return normalizedValue;
  }

  const regex = new RegExp(`(${escapeRegex(normalizedQuery)})`, "ig");
  const parts = normalizedValue.split(regex).filter(Boolean);

  return parts.map((part, index) => {
    const isMatch = part.toLowerCase() === normalizedQuery.toLowerCase();

    return isMatch ? (
      <mark
        key={`${part}-${index}`}
        className="rounded bg-[var(--accent-glow)] px-0.5 text-[var(--accent-soft)]"
      >
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    );
  });
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function ReceiptSearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path d="M7 3h10a2 2 0 0 1 2 2v16l-2.5-1.5L14 21l-2.5-1.5L9 21l-2.5-1.5L4 21V5a2 2 0 0 1 2-2Z" />
      <path d="M8 8h8" />
      <path d="M8 12h5" />
      <circle cx="17.5" cy="16.5" r="2.5" />
      <path d="m20 19 1.2 1.2" />
    </svg>
  );
}

function HeaderIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#23262d] text-white/82 transition hover:border-white/18 hover:text-white"
    >
      {children}
    </Link>
  );
}

function HeaderIconButton({
  label,
  active = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
        active
          ? "border-[var(--accent)] bg-[rgba(211,59,59,0.12)] text-white"
          : "border-white/10 bg-[#23262d] text-white/82 hover:border-white/18 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function SearchResults({
  query,
  loading,
  results,
  onSelect,
}: {
  query: string;
  loading: boolean;
  results: SearchGameItem[];
  onSelect: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#1c1f26]">
      {query.trim().length < 2 ? (
        <div className="px-4 py-3 text-sm text-white/55">
          Ketik minimal 2 huruf untuk mencari game.
        </div>
      ) : loading ? (
        <div className="px-4 py-3 text-sm text-white/55">Mencari game...</div>
      ) : results.length > 0 ? (
        <div className="max-h-[360px] overflow-y-auto py-2">
          {results.map((game) => (
            <Link
              key={game._id}
              href={`/games/${game.code.toLowerCase()}`}
              onClick={onSelect}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5"
            >
              {game.logo ? (
                <Image
                  src={game.logo}
                  alt={game.name}
                  width={44}
                  height={44}
                  sizes="44px"
                  className="h-11 w-11 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/8 text-xs font-semibold tracking-[0.12em] text-white">
                  {getInitials(game.name || "GM") || "GM"}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {renderHighlightedText(game.name, query)}
                </p>
                <p className="mt-0.5 truncate text-xs text-white/58">
                  {renderHighlightedText(
                    game.provider || game.category || game.code,
                    query
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-4 py-3 text-sm text-white/55">
          Game tidak ditemukan.
        </div>
      )}
    </div>
  );
}

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
            ? "bg-[rgba(17,18,23,0.9)] shadow-[0_14px_40px_rgba(0,0,0,0.22)]"
            : "bg-transparent"
        }`}
      >
        <div ref={headerRef} className="site-shell relative">
          <div className="flex items-center justify-between gap-3 py-2.5 sm:py-4">
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
                  className="h-10 w-full rounded-full border border-white/10 bg-[#2a2d34] px-4 pr-11 text-base text-white outline-none transition placeholder:text-white/35 focus:border-white/20 focus:bg-[#30333b] lg:h-11 lg:px-5 lg:text-[15px]"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/45">
                  ⌕
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

            <div className="hidden shrink-0 items-center md:flex">
              <Link
                href="/cek-transaksi"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(211,59,59,0.28)] transition hover:brightness-110"
              >
                <ReceiptSearchIcon />
                <span>Cek Transaksi</span>
              </Link>
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
                    className="h-11 w-full rounded-2xl border border-white/10 bg-[#2a2d34] px-4 pr-11 text-base text-white outline-none transition placeholder:text-white/35 focus:border-white/20 focus:bg-[#30333b]"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/45">
                    ⌕
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
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMenuOpen(false)}
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
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-white/72 transition hover:border-white/18 hover:text-white"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-white/88 transition hover:bg-white/5 hover:text-white"
              >
                Home
              </Link>
              <Link
                href="/cek-transaksi"
                onClick={() => setMenuOpen(false)}
                className="block w-full rounded-2xl bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-4 py-3 text-left text-sm font-semibold text-white shadow-[0_14px_28px_rgba(211,59,59,0.2)] transition hover:brightness-110"
              >
                Cek Transaksi
              </Link>
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
