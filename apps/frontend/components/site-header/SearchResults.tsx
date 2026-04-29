"use client";

import Image from "next/image";
import Link from "next/link";

import {
  getInitials,
  renderHighlightedText,
  type SearchGameItem,
} from "@/components/site-header/shared";

export default function SearchResults({
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
