"use client";

import type { ReactNode } from "react";
import {
  House,
  Menu,
  Newspaper,
  ReceiptText,
  Search,
  Star,
  type LucideIcon,
} from "lucide-react";

export type SearchGameItem = {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  provider?: string;
  category?: string;
};

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/artikel", label: "Artikel", icon: Newspaper },
  { href: "/reviews", label: "Ulasan", icon: Star },
  { href: "/cek-transaksi", label: "Cek Transaksi", icon: ReceiptText },
];

export function getInitials(value: string) {
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

export function renderHighlightedText(value: string, query: string) {
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

export function isNavigationItemActive(pathname: string, href: string) {
  const normalizedPathname = String(pathname || "");

  if (href === "/") {
    return normalizedPathname === "/";
  }

  if (href === "/cek-transaksi") {
    return (
      normalizedPathname === href || normalizedPathname.startsWith("/invoice/")
    );
  }

  return (
    normalizedPathname === href ||
    normalizedPathname.startsWith(`${href}/`)
  );
}

export function SearchIcon() {
  return <Search className="h-[19px] w-[19px]" strokeWidth={2.1} aria-hidden="true" />;
}

export function HamburgerIcon() {
  return <Menu className="h-[19px] w-[19px]" strokeWidth={2.1} aria-hidden="true" />;
}

export function HeaderIconButton({
  label,
  active = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition sm:h-11 sm:w-11 ${
        active
          ? "border-[var(--accent)] bg-[rgba(211,59,59,0.14)] text-white shadow-[0_10px_26px_rgba(211,59,59,0.16)]"
          : "border-white/10 bg-[#23262d] text-white/82 hover:border-[#d33b3b]/35 hover:bg-[#2a2d34] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
