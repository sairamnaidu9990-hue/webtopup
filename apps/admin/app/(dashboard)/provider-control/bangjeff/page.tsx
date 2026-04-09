"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SyncPanel from "@/app/components/bangjeff/SyncPanel";
import {
  CATALOG_CACHE_TTL_MS,
  GAMES_CACHE_KEY,
  VARIANTS_CACHE_KEY,
} from "@/app/lib/catalogCache";
import Card from "../../../components/ui/Card";
import SectionTitle from "../../../components/ui/SectionTitle";
import {
  isSessionCacheFresh,
  readSessionCache,
  writeSessionCache,
} from "@/app/lib/sessionCache";

const API = process.env.NEXT_PUBLIC_API_URL;

type Game = {
  _id: string;
  status?: string;
  syncSource?: string;
  inputs?: Array<unknown>;
};

type Variant = {
  _id: string;
  status?: string;
  syncSource?: string;
};

type DashboardStats = {
  totalGames: number;
  activeGames: number;
  totalVariants: number;
  activeVariants: number;
  bangjeffGames: number;
  bangjeffVariants: number;
  gamesWithInputs: number;
};

const emptyStats: DashboardStats = {
  totalGames: 0,
  activeGames: 0,
  totalVariants: 0,
  activeVariants: 0,
  bangjeffGames: 0,
  bangjeffVariants: 0,
  gamesWithInputs: 0,
};

export default function BangjeffDashboardPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const gamesCacheKey = `${GAMES_CACHE_KEY}:bangjeff`;
  const variantsCacheKey = `${VARIANTS_CACHE_KEY}:bangjeff`;

  const fetchDashboardData = async ({
    refreshGames = true,
    refreshVariants = true,
  }: {
    refreshGames?: boolean;
    refreshVariants?: boolean;
  } = {}) => {
    try {
      const requests: Array<Promise<Response>> = [];

      if (refreshGames) {
        requests.push(fetch(`${API}/api/games?syncSource=bangjeff`));
      }

      if (refreshVariants) {
        requests.push(fetch(`${API}/api/variants?syncSource=bangjeff`));
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
  };

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
      fetchDashboardData({
        refreshGames: shouldRefreshGames,
        refreshVariants: shouldRefreshVariants,
      });
    }
  }, [gamesCacheKey, variantsCacheKey]);

  const stats: DashboardStats = {
    totalGames: games.length,
    activeGames: games.filter((game) => game.status === "ACTIVE").length,
    totalVariants: variants.length,
    activeVariants: variants.filter((variant) => variant.status === "ACTIVE")
      .length,
    bangjeffGames: games.filter((game) => game.syncSource === "bangjeff").length,
    bangjeffVariants: variants.filter(
      (variant) => variant.syncSource === "bangjeff"
    ).length,
    gamesWithInputs: games.filter((game) => (game.inputs?.length || 0) > 0)
      .length,
  };

  const quickLinks = [
    {
      title: "Provider Control",
      href: "/provider-control",
      description:
        "Kembali ke landing page provider untuk melihat struktur navigasi dan provider lain yang nanti akan ditambahkan.",
    },
    {
      title: "Markup Variant",
      href: "/provider-control/bangjeff/markup",
      description:
        "Kelola penyesuaian markup massal untuk seluruh variant atau per game dari halaman operasional khusus.",
    },
    {
      title: "BangJeff Games",
      href: "/provider-control/bangjeff/games",
      description:
        "Kelola metadata game internal seperti provider, logo, status, dan field input yang ditampilkan ke user.",
    },
    {
      title: "BangJeff Variants",
      href: "/provider-control/bangjeff/variants",
      description:
        "Atur harga dasar, markup, logo variant, region, dan status jual setiap item katalog.",
    },
    {
      title: "Dashboard Utama",
      href: "/dashboard",
      description:
        "Kembali ke ringkasan operasional utama tanpa mencampur area sinkronisasi provider.",
    },
  ];

  const highlights = loading ? emptyStats : stats;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="BangJeff Dashboard"
        subtitle="Pusat sinkronisasi katalog BangJeff ke database internal agar admin panel dan frontend memakai sumber data yang konsisten."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Total Games" variant="info">
          <p className="text-4xl font-bold tracking-tight">
            {highlights.totalGames}
          </p>
          <p className="mt-2 text-sm text-white/80">
            {highlights.activeGames} game aktif siap ditampilkan di katalog
          </p>
        </Card>

        <Card title="Total Variants" variant="success">
          <p className="text-4xl font-bold tracking-tight">
            {highlights.totalVariants}
          </p>
          <p className="mt-2 text-sm text-white/80">
            {highlights.activeVariants} variant aktif siap dijual
          </p>
        </Card>

        <Card title="BangJeff Synced" variant="warning">
          <p className="text-4xl font-bold tracking-tight">
            {highlights.bangjeffGames}
          </p>
          <p className="mt-2 text-sm text-white/80">
            {highlights.bangjeffGames} game dan {highlights.bangjeffVariants} variant berasal dari sinkronisasi provider
          </p>
        </Card>

        <Card title="Input Ready" variant="danger">
          <p className="text-4xl font-bold tracking-tight">
            {highlights.gamesWithInputs}
          </p>
          <p className="mt-2 text-sm text-white/80">
            {highlights.gamesWithInputs} game sudah memiliki skema input untuk validasi transaksi
          </p>
        </Card>
      </div>

      <SyncPanel
        apiBase={API || ""}
        onSynced={() =>
          fetchDashboardData({
            refreshGames: true,
            refreshVariants: true,
          })
        }
        title="Sinkronisasi BangJeff"
        description="Jalankan pembaruan katalog dari BangJeff ke database internal. Proses ini menambahkan data baru dan memperbarui status data yang sudah ada."
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card title="Navigasi Terkait">
          <div className="space-y-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition hover:border-gray-300 hover:bg-white"
              >
                <p className="font-semibold text-gray-900">{link.title}</p>
                <p className="mt-1 text-sm text-gray-600">{link.description}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Proses Operasional">
          <div className="space-y-4 text-sm text-gray-600">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">1. Sinkronisasi Sumber</p>
              <p className="mt-1">
                Ambil katalog terbaru dari BangJeff untuk menambahkan produk
                baru dan memperbarui status data yang sudah ada di database.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">2. Kurasi Internal</p>
              <p className="mt-1">
                Lengkapi data internal seperti provider, logo, markup, dan
                status jual tanpa mengubah struktur data asli dari provider.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">3. Distribusi Katalog</p>
              <p className="mt-1">
                Frontend dan panel admin membaca katalog dari database internal
                agar performa, konsistensi data, dan kontrol operasional tetap
                terjaga.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
