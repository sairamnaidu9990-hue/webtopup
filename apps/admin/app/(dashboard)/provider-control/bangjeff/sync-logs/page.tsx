"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "../../../../components/ui/Card";
import SectionTitle from "../../../../components/ui/SectionTitle";
import type { SyncLog } from "@/app/types/SyncLog";

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatAction(action: string) {
  const labels: Record<string, string> = {
    sync_games: "Sync Games",
    sync_game_details: "Sync Details",
    sync_variants: "Sync Variants",
    sync_catalog: "Sync All",
    sync_markup_all_variants: "Sync Markup Semua Variant",
    sync_markup_game_variants: "Sync Markup Per Game",
  };

  return labels[action] || action;
}

export default function BangjeffSyncLogsPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");

  const fetchLogs = async () => {
    try {
      setError("");
      const response = await fetch("/api/sync-logs?provider=bangjeff", {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Gagal memuat sync logs");
      }

      setLogs(Array.isArray(payload.logs) ? payload.logs : []);
      setLastUpdatedAt(new Date().toISOString());
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Gagal memuat sync logs"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();

    const intervalId = window.setInterval(() => {
      void fetchLogs();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  const actionOptions = Array.from(new Set(logs.map((log) => log.action)));
  const filteredLogs = logs.filter((log) => {
    const matchesStatus =
      statusFilter === "ALL" || log.status === statusFilter;
    const matchesAction =
      actionFilter === "ALL" || log.action === actionFilter;

    return matchesStatus && matchesAction;
  });

  const stats = useMemo(
    () => ({
      total: logs.length,
      processing: logs.filter((log) => log.status === "PROCESSING").length,
      success: logs.filter((log) => log.status === "SUCCESS").length,
      failed: logs.filter((log) => log.status === "FAILED").length,
    }),
    [logs]
  );

  return (
    <div className="space-y-6">
      <SectionTitle
        title="BangJeff Sync Logs"
        subtitle="Riwayat sync."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Total Logs" variant="info">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.total}
          </p>
        </Card>

        <Card title="Sedang Diproses" variant="warning">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.processing}
          </p>
        </Card>

        <Card title="Success" variant="success">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.success}
          </p>
        </Card>

        <Card title="Failed" variant="danger">
          <p className="text-4xl font-bold tracking-tight">
            {loading ? 0 : stats.failed}
          </p>
        </Card>
      </div>

      <Card title="Filter Logs">
        <div className="grid gap-4 md:grid-cols-2 xl:max-w-3xl">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            >
              <option value="ALL">Semua status</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Aksi
            </label>
            <select
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            >
              <option value="ALL">Semua aksi</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {formatAction(action)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card title="Riwayat Sinkronisasi">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <p>Halaman ini refresh otomatis tiap 5 detik.</p>
          <p>
            Terakhir diperbarui: {lastUpdatedAt ? formatDate(lastUpdatedAt) : "-"}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Memuat sync logs...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : filteredLogs.length === 0 ? (
          <p className="text-sm text-gray-500">
            Belum ada log yang cocok dengan filter saat ini.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log._id}
                className="rounded-2xl border border-gray-200 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {formatAction(log.action)}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          log.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700"
                            : log.status === "PROCESSING"
                              ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                        {log.scope || "provider"}
                      </span>
                      {log.productCode ? (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                          {log.productCode}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      Actor: {log.triggeredBy?.name || "-"} •{" "}
                      {log.triggeredBy?.email || "admin tidak tercatat"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(log.createdAt)}
                    </p>
                    {log.status === "PROCESSING" && log.updatedAt ? (
                      <p className="mt-1 text-xs text-amber-600">
                        Sedang berjalan, terakhir diupdate {formatDate(log.updatedAt)}
                      </p>
                    ) : null}

                    {log.errorMessage ? (
                      <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                        {log.errorMessage}
                      </p>
                    ) : null}
                  </div>

                  <div className="w-full max-w-xl rounded-2xl bg-gray-50 p-3 text-sm text-gray-600">
                    <p className="font-medium text-gray-900">Ringkasan</p>
                    <div className="mt-2 space-y-1">
                      {log.summary ? (
                        Object.entries(log.summary)
                          .slice(0, 6)
                          .map(([key, value]) => (
                            <p key={key} className="break-words">
                              <span className="font-medium text-gray-800">
                                {key}:
                              </span>{" "}
                              {typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value)}
                            </p>
                          ))
                      ) : (
                        <p>Tidak ada ringkasan tambahan.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
