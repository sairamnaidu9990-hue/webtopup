"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import VariantMarkupSyncPanel from "@/app/components/variants/VariantMarkupSyncPanel";
import {
  CATALOG_CACHE_TTL_MS,
  GAMES_CACHE_KEY,
  VARIANTS_CACHE_KEY,
} from "@/app/lib/catalogCache";
import {
  isSessionCacheFresh,
  readSessionCache,
  writeSessionCache,
} from "@/app/lib/sessionCache";
import { Variant } from "@/app/types/Variant";
import Card from "../../../../components/ui/Card";
import SectionTitle from "../../../../components/ui/SectionTitle";

type Game = {
  _id: string;
  name: string;
  code: string;
  status?: string;
};

export default function ManualMarkupPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const gamesCacheKey = `${GAMES_CACHE_KEY}:manual`;
  const variantsCacheKey = `${VARIANTS_CACHE_KEY}:manual`;

  const fetchData = useCallback(async ({
    refreshGames = true,
    refreshVariants = true,
  }: {
    refreshGames?: boolean;
    refreshVariants?: boolean;
  } = {}) => {
    try {
      const requests: Array<Promise<Response>> = [];

      if (refreshGames) {
        requests.push(fetch("/api/games?syncSource=manual"));
      }

      if (refreshVariants) {
        requests.push(fetch("/api/variants?syncSource=manual"));
      }

      const responses = await Promise.all(requests);
      let responseIndex = 0;

      if (refreshGames) {
        const gamesResponse = responses[responseIndex++];
        const gamesPayload = await gamesResponse.json();
        const nextGames = Array.isArray(gamesPayload) ? gamesPayload : [];

        setGames(nextGames);
        writeSessionCache(gamesCacheKey, nextGames);
      }

      if (refreshVariants) {
        const variantsResponse = responses[responseIndex++];
        const variantsPayload = await variantsResponse.json();
        const nextVariants = Array.isArray(variantsPayload)
          ? variantsPayload
          : [];

        setVariants(nextVariants);
        writeSessionCache(variantsCacheKey, nextVariants);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [gamesCacheKey, variantsCacheKey]);

  useEffect(() => {
    const cachedGames = readSessionCache<Game[]>(gamesCacheKey);
    const cachedVariants = readSessionCache<Variant[]>(variantsCacheKey);

    const hasCachedGames =
      !!cachedGames?.data && Array.isArray(cachedGames.data);
    const hasCachedVariants =
      !!cachedVariants?.data && Array.isArray(cachedVariants.data);

    if (hasCachedGames) {
      setGames(cachedGames.data);
    }

    if (hasCachedVariants) {
      setVariants(cachedVariants.data);
    }

    if (hasCachedGames || hasCachedVariants) {
      setLoading(false);
    }

    const shouldRefreshGames =
      !hasCachedGames ||
      !isSessionCacheFresh(cachedGames.savedAt, CATALOG_CACHE_TTL_MS);
    const shouldRefreshVariants =
      !hasCachedVariants ||
      !isSessionCacheFresh(cachedVariants.savedAt, CATALOG_CACHE_TTL_MS);

    if (shouldRefreshGames || shouldRefreshVariants) {
      void fetchData({
        refreshGames: shouldRefreshGames,
        refreshVariants: shouldRefreshVariants,
      });
    }
  }, [fetchData, gamesCacheKey, variantsCacheKey]);

  const stats = useMemo(() => {
    const activeVariants = variants.filter(
      (variant) => variant.status === "ACTIVE"
    ).length;
    const activeGames = games.filter((game) => game.status === "ACTIVE").length;
    const gameIds = new Set(
      variants
        .map((variant) => variant.game?._id)
        .filter((gameId): gameId is string => Boolean(gameId))
    );

    return {
      totalGames: games.length,
      activeGames,
      totalVariants: variants.length,
      activeVariants,
      coveredGames: gameIds.size,
    };
  }, [games, variants]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Manual Markup"
        subtitle="Halaman khusus untuk mengelola markup massal pada katalog manual yang dibuat dan dipelihara langsung oleh tim admin."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Manual Variants" variant="info">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.totalVariants}
          </p>
        </Card>

        <Card title="Manual Games" variant="success">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.totalGames}
          </p>
        </Card>

        <Card title="Game Tercakup" variant="warning">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.coveredGames}
          </p>
        </Card>

        <Card title="Mode Operasional" variant="danger">
          <p className="text-base font-semibold">Bulk Markup</p>
        </Card>
      </div>

      <VariantMarkupSyncPanel
        apiBase=""
        games={games}
        syncSource="manual"
        onSynced={() =>
          fetchData({
            refreshGames: false,
            refreshVariants: true,
          })
        }
      />

      <div className="grid gap-6">
        <Card title="Panduan Penggunaan">
          <div className="space-y-4 text-sm text-gray-600">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">
                Sync semua variant manual
              </p>
              <p className="mt-1">
                Gunakan saat strategi margin berlaku sama untuk seluruh katalog
                manual yang dikelola internal.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">
                Sync per game manual
              </p>
              <p className="mt-1">
                Gunakan untuk game internal tertentu yang memerlukan margin
                khusus, misalnya event, promo, atau bundle spesial.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">Catatan produksi</p>
              <p className="mt-1">
                Perubahan markup hanya memengaruhi variant dengan source
                `manual`, sehingga katalog BangJeff tetap aman dan terpisah.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
