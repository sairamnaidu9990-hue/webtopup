"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import Card from "../../components/ui/Card";
import SectionTitle from "../../components/ui/SectionTitle";

type Game = {
  _id: string;
  syncSource?: string;
  status?: string;
};

export default function ProviderControlPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async ({
    refreshGames = true,
    refreshVariants = true,
  }: {
    refreshGames?: boolean;
    refreshVariants?: boolean;
  } = {}) => {
    try {
      const requests: Array<Promise<Response>> = [];

      if (refreshGames) {
        requests.push(fetch("/api/games"));
      }

      if (refreshVariants) {
        requests.push(fetch("/api/variants"));
      }

      const responses = await Promise.all(requests);
      let responseIndex = 0;

      if (refreshGames) {
        const gamesResponse = responses[responseIndex++];
        const gamesPayload = await gamesResponse.json();
        const nextGames = Array.isArray(gamesPayload) ? gamesPayload : [];

        setGames(nextGames);
        writeSessionCache(GAMES_CACHE_KEY, nextGames);
      }

      if (refreshVariants) {
        const variantsResponse = responses[responseIndex++];
        const variantsPayload = await variantsResponse.json();
        const nextVariants = Array.isArray(variantsPayload)
          ? variantsPayload
          : [];

        setVariants(nextVariants);
        writeSessionCache(VARIANTS_CACHE_KEY, nextVariants);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedGames = readSessionCache<Game[]>(GAMES_CACHE_KEY);
    const cachedVariants = readSessionCache<Variant[]>(VARIANTS_CACHE_KEY);

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
      fetchData({
        refreshGames: shouldRefreshGames,
        refreshVariants: shouldRefreshVariants,
      });
    }
  }, []);

  const stats = useMemo(() => {
    const bangjeffGames = games.filter(
      (game) => game.syncSource === "bangjeff"
    ).length;
    const bangjeffVariants = variants.filter(
      (variant) => variant.syncSource === "bangjeff"
    ).length;
    const manualGames = games.filter((game) => game.syncSource === "manual").length;
    const manualVariants = variants.filter(
      (variant) => variant.syncSource === "manual"
    ).length;

    return {
      totalProviders: 2,
      automatedProviders: 1,
      bangjeffGames,
      bangjeffVariants,
      manualGames,
      manualVariants,
    };
  }, [games, variants]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Provider Control"
        subtitle="Area operasional untuk mengelola koneksi provider, sinkronisasi katalog, dan aksi massal yang berhubungan dengan sumber data eksternal."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Total Providers" variant="info">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.totalProviders}
          </p>
        </Card>

        <Card title="Provider Otomatis" variant="success">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.automatedProviders}
          </p>
        </Card>

        <Card title="BangJeff Catalog" variant="warning">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.bangjeffGames}
          </p>
        </Card>

        <Card title="Manual Catalog" variant="danger">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.manualGames}
          </p>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card title="Daftar Provider">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Link
              href="/provider-control/bangjeff"
              className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition hover:border-gray-300 hover:bg-white"
            >
              <p className="font-semibold text-gray-900">BangJeff Dashboard</p>
            </Link>

            <Link
              href="/provider-control/bangjeff/markup"
              className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition hover:border-gray-300 hover:bg-white"
            >
              <p className="font-semibold text-gray-900">BangJeff Markup</p>
            </Link>

            <Link
              href="/provider-control/manual"
              className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition hover:border-gray-300 hover:bg-white"
            >
              <p className="font-semibold text-gray-900">Manual Dashboard</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
