"use client";

import type { ReactNode } from "react";

export type SearchGameItem = {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  provider?: string;
  category?: string;
};

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

export function SearchIcon() {
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

export function HamburgerIcon() {
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

export function ReceiptSearchIcon() {
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
