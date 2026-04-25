"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { StorefrontGame } from "@/lib/siteData";

const DEFAULT_CHUNK_SIZE = 12;

function getChunkSize(width: number) {
  if (width >= 1024) {
    return 12;
  }

  if (width >= 768) {
    return 8;
  }

  return 12;
}

function AllGamesCard({ game }: { game: StorefrontGame }) {
  const initials = game.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <Link
      href={`/games/${game.code.toLowerCase()}`}
      className="group block overflow-hidden rounded-[18px] border border-[rgba(214,168,104,0.44)] bg-[#10131a] transition duration-300 hover:-translate-y-1 hover:border-[#d33b3b] hover:shadow-[0_0_0_1px_rgba(211,59,59,0.24),0_18px_38px_rgba(0,0,0,0.26)] focus-visible:-translate-y-1 focus-visible:border-[#d33b3b] focus-visible:shadow-[0_0_0_1px_rgba(211,59,59,0.24),0_18px_38px_rgba(0,0,0,0.26)] active:-translate-y-1 active:border-[#d33b3b] active:shadow-[0_0_0_1px_rgba(211,59,59,0.24),0_18px_38px_rgba(0,0,0,0.26)] sm:rounded-[20px]"
    >
      <div className="relative overflow-hidden rounded-[18px] bg-[#10131a] sm:rounded-[20px]">
        <div className="relative aspect-[3/4.35] w-full">
          {game.logo ? (
            <Image
              src={game.logo}
              alt={game.name}
              fill
              sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
              className="object-cover object-center transition duration-300 group-hover:scale-[1.035] group-hover:brightness-[0.72] group-focus-visible:scale-[1.035] group-focus-visible:brightness-[0.72] group-active:scale-[1.035] group-active:brightness-[0.72]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/10 text-lg font-semibold tracking-[0.18em] text-white transition duration-300 group-hover:bg-white/[0.14] group-focus-visible:bg-white/[0.14] group-active:bg-white/[0.14]">
              {initials || "GM"}
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,14,0)_0%,rgba(8,10,14,0.04)_48%,rgba(8,10,14,0.14)_100%)] opacity-0 transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100" />

        <div className="absolute inset-x-0 bottom-0 translate-y-4 border-t border-[rgba(211,59,59,0.34)] bg-[linear-gradient(180deg,rgba(10,12,16,0.08)_0%,rgba(10,12,16,0.44)_18%,rgba(10,12,16,0.88)_100%)] px-2.5 pb-3 pt-5 text-left opacity-0 shadow-[0_14px_28px_rgba(0,0,0,0.28)] backdrop-blur-sm transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 group-active:translate-y-0 group-active:opacity-100 sm:px-3 sm:pb-3.5 sm:pt-6">
          <p className="truncate font-[family-name:var(--font-display)] text-[13px] font-semibold leading-[1.28] tracking-tight text-white sm:text-[14px]">
            {game.name}
          </p>
          <p className="mt-1.5 truncate text-[11px] font-medium text-white/78 sm:text-[12px]">
            {game.provider || "Provider belum diatur"}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function AllGamesSection({
  games,
  categories,
}: {
  games: StorefrontGame[];
  categories: string[];
}) {
  const [chunkSize, setChunkSize] = useState(DEFAULT_CHUNK_SIZE);
  const [visibleCount, setVisibleCount] = useState(DEFAULT_CHUNK_SIZE);
  const [activeCategory, setActiveCategory] = useState(categories[0] || "Topup Game");

  useEffect(() => {
    const updateGridSize = () => {
      const nextChunkSize = getChunkSize(window.innerWidth);

      setChunkSize(nextChunkSize);
      setVisibleCount((current) =>
        current <= DEFAULT_CHUNK_SIZE
          ? nextChunkSize
          : Math.max(current, nextChunkSize)
      );
    };

    updateGridSize();
    window.addEventListener("resize", updateGridSize, { passive: true });

    return () => window.removeEventListener("resize", updateGridSize);
  }, []);

  const resolvedActiveCategory =
    categories.length > 0 && categories.includes(activeCategory)
      ? activeCategory
      : (categories[0] || "Topup Game");

  const filteredGames =
    games.filter(
      (game) => (game.category || "Topup Game") === resolvedActiveCategory
    );
  const visibleGames = filteredGames.slice(0, visibleCount);
  const hasMore = visibleCount < filteredGames.length;

  return (
    <div className="mt-6">
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((category) => {
          const isActive = category === resolvedActiveCategory;

          return (
            <button
              key={category}
              type="button"
              onClick={() => {
                setActiveCategory(category);
                setVisibleCount(chunkSize);
              }}
              className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                isActive
                  ? "border-[#d33b3b] bg-[#27161a] text-white"
                  : "border-white/10 bg-[#171a21] text-white/72 hover:border-white/18 hover:text-white"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {filteredGames.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-[#171922] px-6 py-10 text-center text-sm text-white/45 sm:rounded-[28px]">
          Belum ada Product pada kategori {activeCategory}.
        </div>
      ) : null}

      {filteredGames.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
            {visibleGames.map((game) => (
              <AllGamesCard key={game._id} game={game} />
            ))}
          </div>

          {hasMore ? (
            <div className="flex justify-center pt-6 sm:pt-7">
              <button
                type="button"
                onClick={() =>
                  setVisibleCount((current) =>
                    Math.min(current + chunkSize, filteredGames.length)
                  )
                }
                className="relative z-10 inline-flex cursor-pointer items-center justify-center rounded-full border border-white/12 bg-[#171a21] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#d33b3b] hover:bg-[#1d2028] hover:text-white"
              >
                Tampilkan Lainnya...
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
