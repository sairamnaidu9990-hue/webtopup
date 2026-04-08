"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SyncPanel from "@/app/components/bangjeff/SyncPanel";
import Card from "../../components/ui/Card";
import SectionTitle from "../../components/ui/SectionTitle";

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

export default function DashboardPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [gamesResponse, variantsResponse] = await Promise.all([
        fetch(`${API}/api/games`),
        fetch(`${API}/api/variants`),
      ]);

      const [gamesPayload, variantsPayload] = await Promise.all([
        gamesResponse.json(),
        variantsResponse.json(),
      ]);

      setGames(Array.isArray(gamesPayload) ? gamesPayload : []);
      setVariants(Array.isArray(variantsPayload) ? variantsPayload : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
      title: "Kelola Games",
      href: "/games",
      description:
        "Rapikan nama, provider, logo, status, dan data input game tanpa menjalankan sync dari halaman ini.",
    },
    {
      title: "Kelola Variants",
      href: "/variants",
      description:
        "Review nominal, harga modal, markup, logo variant, dan status aktif dari katalog BangJeff.",
    },
    {
      title: "Pantau Orders",
      href: "/orders",
      description:
        "Halaman order masih placeholder, tapi route-nya sudah siap dipakai saat flow transaksi dibangun.",
    },
  ];

  const highlights = loading ? emptyStats : stats;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Bangjeff Dashboard"
        subtitle="Pusat kontrol provider Bangjeff untuk sync katalog ke database kamu, lalu dipakai bersama oleh admin panel dan frontend user."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Total Games" variant="info">
          <p className="text-4xl font-bold tracking-tight">
            {highlights.totalGames}
          </p>
          <p className="mt-2 text-sm text-white/80">
            {highlights.activeGames} game aktif di katalog
          </p>
        </Card>

        <Card title="Total Variants" variant="success">
          <p className="text-4xl font-bold tracking-tight">
            {highlights.totalVariants}
          </p>
          <p className="mt-2 text-sm text-white/80">
            {highlights.activeVariants} variant aktif untuk dijual
          </p>
        </Card>

        <Card title="BangJeff Synced" variant="warning">
          <p className="text-4xl font-bold tracking-tight">
            {highlights.bangjeffGames}
          </p>
          <p className="mt-2 text-sm text-white/80">
            game sinkron dan {highlights.bangjeffVariants} variant dari BangJeff
          </p>
        </Card>

        <Card title="Input Ready" variant="danger">
          <p className="text-4xl font-bold tracking-tight">
            {highlights.gamesWithInputs}
          </p>
          <p className="mt-2 text-sm text-white/80">
            game sudah punya product detail untuk validasi input user
          </p>
        </Card>
      </div>

      <SyncPanel
        apiBase={API || ""}
        onSynced={fetchDashboardData}
        title="BangJeff Control"
        description="Semua tombol sync provider dipusatkan di dashboard ini supaya alur update katalog tetap rapi."
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card title="Quick Actions">
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

        <Card title="Workflow">
          <div className="space-y-4 text-sm text-gray-600">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">1. Sync dari Dashboard</p>
              <p className="mt-1">
                Tarik catalog live Bangjeff ke backend kamu lewat tombol sync,
                lalu backend update database MongoDB.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">2. Rapikan di Admin</p>
              <p className="mt-1">
                Edit provider, logo game, logo variant, markup, dan status tanpa
                perlu menyentuh data provider satu per satu dari awal.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">3. Frontend Hit Database</p>
              <p className="mt-1">
                User site dan admin panel sama-sama membaca katalog dari database
                kamu, jadi performa dan kontrol tetap di tanganmu.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
