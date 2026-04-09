"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

const API = process.env.NEXT_PUBLIC_API_URL;

type Game = {
  _id: string;
  name: string;
  code: string;
  status?: string;
};

export default function BangjeffMarkupPage() {
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
        requests.push(fetch(`${API}/api/games`));
      }

      if (refreshVariants) {
        requests.push(fetch(`${API}/api/variants`));
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
        title="Markup Variant"
        subtitle="Halaman khusus untuk mengelola sinkronisasi markup massal BangJeff tanpa menumpuk aksi bulk di halaman variant harian."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Total Variants" variant="info">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.totalVariants}
          </p>
          <p className="mt-2 text-sm text-white/80">
            {loading ? 0 : stats.activeVariants} variant aktif siap menerima
            pembaruan markup
          </p>
        </Card>

        <Card title="Total Games" variant="success">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.totalGames}
          </p>
          <p className="mt-2 text-sm text-white/80">
            {loading ? 0 : stats.activeGames} game aktif tersimpan di katalog
          </p>
        </Card>

        <Card title="Game Tercakup" variant="warning">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.coveredGames}
          </p>
          <p className="mt-2 text-sm text-white/80">
            Jumlah game yang saat ini sudah memiliki variant di database
          </p>
        </Card>

        <Card title="Mode Operasional" variant="danger">
          <p className="text-base font-semibold">Bulk Markup</p>
          <p className="mt-2 text-sm text-white/80">
            Gunakan untuk penyesuaian margin cepat saat strategi harga berubah
            secara menyeluruh atau per game tertentu.
          </p>
        </Card>
      </div>

      <VariantMarkupSyncPanel
        apiBase={API || ""}
        games={games}
        onSynced={() =>
          fetchData({
            refreshGames: false,
            refreshVariants: true,
          })
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card title="Panduan Penggunaan">
          <div className="space-y-4 text-sm text-gray-600">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">
                Sync semua variant
              </p>
              <p className="mt-1">
                Gunakan saat kebijakan margin berlaku sama untuk seluruh katalog
                dan kamu ingin memperbarui harga jual secara massal.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">Sync per game</p>
              <p className="mt-1">
                Gunakan untuk game dengan karakter pasar khusus, misalnya butuh
                margin lebih agresif atau lebih kompetitif dibanding game lain.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">Catatan produksi</p>
              <p className="mt-1">
                Perubahan markup akan menghitung ulang harga jual dari harga
                modal yang sudah tersimpan, tanpa mengubah data sumber BangJeff.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Navigasi Cepat">
          <div className="space-y-3">
            <Link
              href="/provider-control/bangjeff"
              className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition hover:border-gray-300 hover:bg-white"
            >
              <p className="font-semibold text-gray-900">BangJeff Dashboard</p>
              <p className="mt-1 text-sm text-gray-600">
                Kembali ke dashboard provider untuk sinkronisasi katalog dan
                ringkasan data.
              </p>
            </Link>

            <Link
              href="/variants"
              className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition hover:border-gray-300 hover:bg-white"
            >
              <p className="font-semibold text-gray-900">Kelola Variant</p>
              <p className="mt-1 text-sm text-gray-600">
                Lanjutkan edit variant satu per satu setelah penyesuaian markup
                massal selesai.
              </p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
