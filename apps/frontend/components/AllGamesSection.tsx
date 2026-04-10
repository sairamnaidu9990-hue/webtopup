"use client";

import { useEffect, useState } from "react";
import type { StorefrontGame } from "@/lib/siteData";

function getColumnCount(width: number) {
  if (width >= 1024) {
    return 6;
  }

  if (width >= 768) {
    return 4;
  }

  return 3;
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
    <article className="overflow-hidden rounded-[18px] border border-transparent bg-[#1a1c23] transition duration-300 hover:-translate-y-1 hover:border-[#d33b3b] hover:shadow-[0_0_0_1px_rgba(211,59,59,0.22),0_16px_34px_rgba(0,0,0,0.22)] sm:rounded-[20px]">
      <div className="relative overflow-hidden rounded-[18px] bg-[#10131a] sm:rounded-[20px]">
        {game.logo ? (
          <img
            src={game.logo}
            alt={game.name}
            className="aspect-[3/4.35] w-full object-cover object-center"
          />
        ) : (
          <div className="flex aspect-[3/4.35] w-full items-center justify-center bg-white/10 text-lg font-semibold tracking-[0.18em] text-white">
            {initials || "GM"}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(180deg,rgba(8,10,14,0)_0%,rgba(8,10,14,0.14)_18%,rgba(8,10,14,0.88)_100%)]" />

        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-[rgba(12,14,19,0.58)] px-2.5 pb-3 pt-5 text-center shadow-[0_10px_24px_rgba(0,0,0,0.24)] backdrop-blur-md sm:px-3 sm:pb-3.5 sm:pt-6">
          <p className="truncate font-[family-name:var(--font-display)] text-[13px] font-semibold leading-[1.28] tracking-tight text-white sm:text-[14px]">
            {game.name}
          </p>
          <p className="mt-1.5 truncate text-[11px] font-medium text-white/78 sm:text-[12px]">
            {game.provider || "Provider belum diatur"}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function AllGamesSection({
  games,
}: {
  games: StorefrontGame[];
}) {
  const [chunkSize, setChunkSize] = useState(6);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    const updateGridSize = () => {
      const nextChunkSize = getColumnCount(window.innerWidth) * 2;

      setChunkSize(nextChunkSize);
      setVisibleCount((current) =>
        current <= 6 ? nextChunkSize : Math.max(current, nextChunkSize)
      );
    };

    updateGridSize();
    window.addEventListener("resize", updateGridSize, { passive: true });

    return () => window.removeEventListener("resize", updateGridSize);
  }, []);

  const visibleGames = games.slice(0, visibleCount);
  const hasMore = visibleCount < games.length;

  return (
    <div className="mt-6">
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
                Math.min(current + chunkSize, games.length)
              )
            }
            className="relative z-10 inline-flex cursor-pointer items-center justify-center rounded-full border border-white/12 bg-[#171a21] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#d33b3b] hover:bg-[#1d2028] hover:text-white"
          >
            Tampilkan Lainnya...
          </button>
        </div>
      ) : null}
    </div>
  );
}
