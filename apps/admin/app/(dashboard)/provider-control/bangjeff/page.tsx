"use client";

import { useCallback, useEffect, useState } from "react";
import SyncPanel from "@/app/components/bangjeff/SyncPanel";
import BangjeffAutoSyncCard from "@/app/components/bangjeff/BangjeffAutoSyncCard";
import { parseJsonSafely } from "@/app/lib/http";
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

type BangjeffBalance = {
  membership?: string;
  region?: string;
  balance?: {
    currency?: string;
    value?: number;
  };
};

type BangjeffBalanceLog = {
  _id: string;
  provider?: string;
  region?: string;
  membership?: string;
  currency?: string;
  balanceValue?: number;
  previousBalanceValue?: number;
  deltaValue?: number;
  changeType?: "UP" | "DOWN" | "SAME";
  source?: string;
  triggeredBy?: {
    name?: string;
    email?: string;
    role?: string;
  };
  createdAt?: string | null;
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

const BALANCE_CACHE_KEY = "admin:bangjeff:balance:v1";
const BALANCE_CACHE_TTL_MS = 1000 * 60;

function formatMoney(currency = "IDR", value = 0) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDateTime(value?: string | number | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatSourceLabel(source?: string) {
  switch (String(source || "").trim().toLowerCase()) {
    case "manual_refresh":
      return "Refresh Manual";
    case "sync_refresh":
      return "Setelah Sync";
    default:
      return "Auto Dashboard";
  }
}

function getDeltaTone(changeType?: string) {
  const normalized = String(changeType || "").trim().toUpperCase();

  if (normalized === "UP") {
    return "text-emerald-600";
  }

  if (normalized === "DOWN") {
    return "text-red-600";
  }

  return "text-gray-500";
}

function formatDelta(currency: string, deltaValue = 0) {
  if (deltaValue > 0) {
    return `+${formatMoney(currency, deltaValue)}`;
  }

  if (deltaValue < 0) {
    return `-${formatMoney(currency, Math.abs(deltaValue))}`;
  }

  return formatMoney(currency, 0);
}

function RefreshIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export default function BangjeffDashboardPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [balance, setBalance] = useState<BangjeffBalance | null>(null);
  const [balanceLogs, setBalanceLogs] = useState<BangjeffBalanceLog[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceLogsLoading, setBalanceLogsLoading] = useState(true);
  const [balanceError, setBalanceError] = useState("");
  const [balanceLogsError, setBalanceLogsError] = useState("");
  const [lastBalanceUpdatedAt, setLastBalanceUpdatedAt] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const gamesCacheKey = `${GAMES_CACHE_KEY}:bangjeff`;
  const variantsCacheKey = `${VARIANTS_CACHE_KEY}:bangjeff`;

  const fetchDashboardData = useCallback(
    async ({
      refreshGames = true,
      refreshVariants = true,
    }: {
      refreshGames?: boolean;
      refreshVariants?: boolean;
    } = {}) => {
      try {
        const requests: Array<Promise<Response>> = [];

        if (refreshGames) {
          requests.push(fetch("/api/games?syncSource=bangjeff"));
        }

        if (refreshVariants) {
          requests.push(fetch("/api/variants?syncSource=bangjeff"));
        }

        const responses = await Promise.all(requests);
        let responseIndex = 0;

        if (refreshGames) {
          const gamesResponse = responses[responseIndex++];
          const gamesPayload = await parseJsonSafely<unknown[]>(gamesResponse);
          const nextGames = Array.isArray(gamesPayload)
            ? (gamesPayload as Game[])
            : [];

          setGames(nextGames);
          writeSessionCache(gamesCacheKey, nextGames);
        }

        if (refreshVariants) {
          const variantsResponse = responses[responseIndex++];
          const variantsPayload = await parseJsonSafely<unknown[]>(variantsResponse);
          const nextVariants = Array.isArray(variantsPayload)
            ? (variantsPayload as Variant[])
            : [];

          setVariants(nextVariants);
          writeSessionCache(variantsCacheKey, nextVariants);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [gamesCacheKey, variantsCacheKey]
  );

  const fetchBalanceLogs = useCallback(async () => {
    try {
      setBalanceLogsLoading(true);
      setBalanceLogsError("");

      const response = await fetch("/api/products/balance/logs?region=ID&limit=12", {
        cache: "no-store",
      });
      const payload = await parseJsonSafely<{
        items?: BangjeffBalanceLog[];
        message?: string;
        error?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || "Log saldo BangJeff gagal diambil"
        );
      }

      setBalanceLogs(Array.isArray(payload?.items) ? payload.items : []);
    } catch (error) {
      setBalanceLogs([]);
      setBalanceLogsError(
        error instanceof Error ? error.message : "Log saldo BangJeff gagal diambil"
      );
    } finally {
      setBalanceLogsLoading(false);
    }
  }, []);

  const fetchBalance = useCallback(
    async ({
      force = false,
      source = "dashboard_auto",
    }: {
      force?: boolean;
      source?: "dashboard_auto" | "manual_refresh" | "sync_refresh";
    } = {}) => {
      try {
        if (!force) {
          const cachedBalance = readSessionCache<BangjeffBalance>(BALANCE_CACHE_KEY);

          if (
            cachedBalance?.data &&
            isSessionCacheFresh(cachedBalance.savedAt, BALANCE_CACHE_TTL_MS)
          ) {
            setBalance(cachedBalance.data);
            setLastBalanceUpdatedAt(cachedBalance.savedAt);
            setBalanceLoading(false);
            setBalanceError("");
            return;
          }
        }

        setBalanceLoading(true);
        setBalanceError("");

        const response = await fetch(
          `/api/products/balance?region=ID&source=${encodeURIComponent(source)}`,
          {
            cache: "no-store",
          }
        );
        const payload = await parseJsonSafely<{
          message?: string;
          data?: BangjeffBalance;
          error?: string;
        }>(response);

        if (!response.ok) {
          throw new Error(
            payload?.error || payload?.message || "Saldo BangJeff gagal diambil"
          );
        }

        const nextBalance = payload?.data || null;
        setBalance(nextBalance);

        if (nextBalance) {
          writeSessionCache(BALANCE_CACHE_KEY, nextBalance);
          setLastBalanceUpdatedAt(Date.now());
        }

        await fetchBalanceLogs();
      } catch (error) {
        setBalanceError(
          error instanceof Error ? error.message : "Saldo BangJeff gagal diambil"
        );
      } finally {
        setBalanceLoading(false);
      }
    },
    [fetchBalanceLogs]
  );

  useEffect(() => {
    const cachedGames = readSessionCache<Game[]>(gamesCacheKey);
    const cachedVariants = readSessionCache<Variant[]>(variantsCacheKey);
    const cachedBalance = readSessionCache<BangjeffBalance>(BALANCE_CACHE_KEY);

    const hasCachedGames = !!cachedGames?.data && Array.isArray(cachedGames.data);
    const hasCachedVariants =
      !!cachedVariants?.data && Array.isArray(cachedVariants.data);
    const hasCachedBalance = !!cachedBalance?.data;

    if (hasCachedGames) {
      setGames(cachedGames.data);
    }

    if (hasCachedVariants) {
      setVariants(cachedVariants.data);
    }

    if (hasCachedBalance) {
      setBalance(cachedBalance.data);
      setLastBalanceUpdatedAt(cachedBalance.savedAt);
      setBalanceLoading(false);
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
      void fetchDashboardData({
        refreshGames: shouldRefreshGames,
        refreshVariants: shouldRefreshVariants,
      });
    }

    void fetchBalanceLogs();

    if (
      !hasCachedBalance ||
      !isSessionCacheFresh(cachedBalance.savedAt, BALANCE_CACHE_TTL_MS)
    ) {
      void fetchBalance({
        force: true,
        source: "dashboard_auto",
      });
    }
  }, [fetchBalance, fetchBalanceLogs, fetchDashboardData, gamesCacheKey, variantsCacheKey]);

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

  const highlights = loading ? emptyStats : stats;
  const balanceValue = formatMoney(
    balance?.balance?.currency || "IDR",
    balance?.balance?.value || 0
  );
  const lastUpdatedText = formatDateTime(lastBalanceUpdatedAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <SectionTitle title="BangJeff Dashboard" />

        <div className="w-full xl:max-w-sm">
          <div className="relative overflow-hidden rounded-[28px] border border-red-200/70 bg-[radial-gradient(circle_at_top_right,_rgba(248,113,113,0.26),_transparent_38%),linear-gradient(135deg,#ffffff_0%,#fff1f2_52%,#ffe4e6_100%)] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-red-200/40 blur-2xl" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-red-500">
                  Saldo Reseller
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
                  {balanceLoading ? "Memuat..." : balanceValue}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void fetchBalance({ force: true, source: "manual_refresh" })
                }
                disabled={balanceLoading}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200/80 bg-white/90 text-red-500 shadow-[0_10px_24px_rgba(239,68,68,0.14)] transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Refresh saldo BangJeff"
                title="Refresh saldo BangJeff"
              >
                <span className={balanceLoading ? "animate-spin" : ""}>
                  <RefreshIcon />
                </span>
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-red-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
                {balance?.membership || "membership -"}
              </span>
              <span className="rounded-full border border-gray-900/10 bg-gray-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                {balance?.region || "ID"}
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                Terakhir update
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {balanceError ? balanceError : lastUpdatedText}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Total Games" variant="info">
          <p className="text-4xl font-bold tracking-tight">
            {highlights.totalGames}
          </p>
        </Card>

        <Card title="Total Variants" variant="success">
          <p className="text-4xl font-bold tracking-tight">
            {highlights.totalVariants}
          </p>
        </Card>

        <Card title="BangJeff Synced" variant="warning">
          <p className="text-4xl font-bold tracking-tight">
            {highlights.bangjeffGames}
          </p>
        </Card>

        <Card title="Input Ready" variant="danger">
          <p className="text-4xl font-bold tracking-tight">
            {highlights.gamesWithInputs}
          </p>
        </Card>
      </div>

      <SyncPanel
        apiBase=""
        onSynced={async () => {
          await fetchDashboardData({
            refreshGames: true,
            refreshVariants: true,
          });
          await fetchBalance({
            force: true,
            source: "sync_refresh",
          });
        }}
        title="Sinkronisasi BangJeff"
        description="Jalankan pembaruan katalog dari BangJeff ke database internal. Proses ini menambahkan data baru dan memperbarui status data yang sudah ada."
      />

      <BangjeffAutoSyncCard />

      <Card title="Log Saldo BangJeff" className="overflow-hidden">
        {balanceLogsLoading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            Memuat riwayat saldo...
          </div>
        ) : balanceLogsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-600">
            {balanceLogsError}
          </div>
        ) : balanceLogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            Belum ada log saldo BangJeff.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-[0.16em] text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Waktu</th>
                  <th className="px-4 py-3 font-semibold">Saldo</th>
                  <th className="px-4 py-3 font-semibold">Selisih</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Admin</th>
                </tr>
              </thead>
              <tbody>
                {balanceLogs.map((item) => {
                  const currency = item.currency || "IDR";
                  const adminName =
                    item.triggeredBy?.name?.trim() ||
                    item.triggeredBy?.email?.trim() ||
                    "-";

                  return (
                    <tr
                      key={item._id}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <td className="px-4 py-3 text-gray-600">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {formatMoney(currency, item.balanceValue || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold ${getDeltaTone(
                            item.changeType
                          )}`}
                        >
                          {formatDelta(currency, item.deltaValue || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatSourceLabel(item.source)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{adminName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
