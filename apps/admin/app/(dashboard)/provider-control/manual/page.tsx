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
import Card from "../../../components/ui/Card";
import SectionTitle from "../../../components/ui/SectionTitle";

type Game = {
  _id: string;
  status?: string;
  syncSource?: string;
};

export default function ManualProviderPage() {
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
    const manualGames = games.filter((game) => game.syncSource === "manual");
    const manualVariants = variants.filter(
      (variant) => variant.syncSource === "manual"
    );

    return {
      totalGames: manualGames.length,
      activeGames: manualGames.filter((game) => game.status === "ACTIVE").length,
      totalVariants: manualVariants.length,
      activeVariants: manualVariants.filter(
        (variant) => variant.status === "ACTIVE"
      ).length,
    };
  }, [games, variants]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Manual Dashboard"
        subtitle="Area provider internal untuk katalog yang dikelola langsung oleh tim admin tanpa proses sinkronisasi dari provider eksternal."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Manual Games" variant="info">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.totalGames}
          </p>
          <p className="mt-2 text-sm text-white/80">
            {loading ? 0 : stats.activeGames} game manual aktif di katalog
          </p>
        </Card>

        <Card title="Manual Variants" variant="success">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.totalVariants}
          </p>
          <p className="mt-2 text-sm text-white/80">
            {loading ? 0 : stats.activeVariants} variant manual aktif siap
            dijual
          </p>
        </Card>

        <Card title="Sumber Data" variant="warning">
          <p className="text-base font-semibold">Internal Management</p>
          <p className="mt-2 text-sm text-white/80">
            Data manual tidak tergantung sinkronisasi provider eksternal dan
            dikelola sepenuhnya dari panel admin.
          </p>
        </Card>

        <Card title="Mode Operasional" variant="danger">
          <p className="text-base font-semibold">Kurasi Manual</p>
          <p className="mt-2 text-sm text-white/80">
            Cocok untuk produk custom, campaign khusus, atau katalog tambahan
            di luar integrasi provider otomatis.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Arah Pengembangan">
          <div className="space-y-4 text-sm text-gray-600">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">
                1. Provider internal
              </p>
              <p className="mt-1">
                Manual diposisikan sebagai provider internal, sehingga struktur
                navigasinya tetap sejajar dengan provider eksternal seperti
                BangJeff.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">
                2. Katalog khusus admin
              </p>
              <p className="mt-1">
                Area ini bisa dipakai untuk produk yang dibuat langsung oleh tim
                admin tanpa menunggu feed produk dari pihak ketiga.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">
                3. Siap ditambah halaman
              </p>
              <p className="mt-1">
                Kalau nanti diperlukan, kita bisa tambahkan child page seperti
                Manual Games, Manual Variants, atau Manual Pricing tanpa
                mengubah struktur sidebar lagi.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Navigasi Cepat">
          <div className="space-y-3">
            <Link
              href="/provider-control"
              className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition hover:border-gray-300 hover:bg-white"
            >
              <p className="font-semibold text-gray-900">Provider Control</p>
              <p className="mt-1 text-sm text-gray-600">
                Kembali ke overview provider untuk berpindah antar area
                operasional.
              </p>
            </Link>

            <Link
              href="/provider-control/manual/games"
              className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition hover:border-gray-300 hover:bg-white"
            >
              <p className="font-semibold text-gray-900">Manual Games</p>
              <p className="mt-1 text-sm text-gray-600">
                Kelola katalog game manual yang dibuat langsung oleh tim admin.
              </p>
            </Link>

            <Link
              href="/provider-control/manual/variants"
              className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition hover:border-gray-300 hover:bg-white"
            >
              <p className="font-semibold text-gray-900">Manual Variants</p>
              <p className="mt-1 text-sm text-gray-600">
                Kelola variant manual untuk produk internal tanpa feed provider
                eksternal.
              </p>
            </Link>

            <Link
              href="/provider-control/manual/markup"
              className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition hover:border-gray-300 hover:bg-white"
            >
              <p className="font-semibold text-gray-900">Manual Markup</p>
              <p className="mt-1 text-sm text-gray-600">
                Atur markup massal untuk seluruh variant manual atau per game.
              </p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
