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
          <p className="mt-2 text-sm text-white/80">
            Provider yang saat ini sudah terhubung ke sistem katalog internal
          </p>
        </Card>

        <Card title="Provider Otomatis" variant="success">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.automatedProviders}
          </p>
          <p className="mt-2 text-sm text-white/80">
            Provider yang saat ini sudah terhubung untuk sinkronisasi katalog
          </p>
        </Card>

        <Card title="BangJeff Catalog" variant="warning">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.bangjeffGames}
          </p>
          <p className="mt-2 text-sm text-white/80">
            {loading ? 0 : stats.bangjeffGames} game dan{" "}
            {loading ? 0 : stats.bangjeffVariants} variant berasal dari
            sinkronisasi BangJeff
          </p>
        </Card>

        <Card title="Manual Catalog" variant="danger">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.manualGames}
          </p>
          <p className="mt-2 text-sm text-white/80">
            {loading ? 0 : stats.manualGames} game dan{" "}
            {loading ? 0 : stats.manualVariants} variant dikelola secara manual
            dari panel admin
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Daftar Provider">
          <div className="space-y-3">
            <Link
              href="/provider-control/bangjeff"
              className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition hover:border-gray-300 hover:bg-white"
            >
              <p className="font-semibold text-gray-900">BangJeff Dashboard</p>
              <p className="mt-1 text-sm text-gray-600">
                Masuk ke dashboard BangJeff untuk sinkronisasi product, detail,
                dan variant dari provider ke database internal.
              </p>
            </Link>

            <Link
              href="/provider-control/bangjeff/markup"
              className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition hover:border-gray-300 hover:bg-white"
            >
              <p className="font-semibold text-gray-900">BangJeff Markup</p>
              <p className="mt-1 text-sm text-gray-600">
                Kelola penyesuaian markup massal untuk seluruh variant atau per
                game dalam satu workflow khusus.
              </p>
            </Link>

            <Link
              href="/provider-control/manual"
              className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition hover:border-gray-300 hover:bg-white"
            >
              <p className="font-semibold text-gray-900">Manual Dashboard</p>
              <p className="mt-1 text-sm text-gray-600">
                Buka provider internal untuk katalog yang dibuat dan dikelola
                langsung oleh tim admin.
              </p>
            </Link>
          </div>
        </Card>

        <Card title="Struktur Siap Dikembangkan">
          <div className="space-y-4 text-sm text-gray-600">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">1. Provider terpisah</p>
              <p className="mt-1">
                Setiap provider dapat memiliki dashboard, aksi markup, log sync,
                dan modul operasional lain tanpa bercampur dengan provider lain.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">2. Navigasi bertingkat</p>
              <p className="mt-1">
                Sidebar sekarang sudah siap menerima provider tambahan di bawah
                grup Provider Control dengan child page masing-masing.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">3. Siap ekspansi</p>
              <p className="mt-1">
                Saat nanti ada provider baru, kita tinggal menambahkan grup
                provider dan route child tanpa merombak layout utama admin.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
