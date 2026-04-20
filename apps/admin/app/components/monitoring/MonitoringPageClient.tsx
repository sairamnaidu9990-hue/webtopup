"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Card from "../ui/Card";
import PaginationControls from "../ui/PaginationControls";

type AppLogActor = {
  email?: string;
  role?: string;
};

type AppLogItem = {
  _id: string;
  level: "info" | "warn" | "error" | "fatal";
  scope: string;
  source?: string;
  message: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number | null;
  durationMs?: number | null;
  actor?: AppLogActor | null;
  meta?: Record<string, unknown> | null;
  error?: {
    name?: string;
    code?: string;
    stack?: string;
  } | null;
  createdAt: string;
};

type AppLogResponse = {
  items: AppLogItem[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

const PAGE_LIMIT = 15;

const levelOptions = [
  { label: "Semua level", value: "" },
  { label: "Warn", value: "warn" },
  { label: "Error", value: "error" },
  { label: "Fatal", value: "fatal" },
  { label: "Info", value: "info" },
];

const scopeOptions = [
  { label: "Semua scope", value: "" },
  { label: "HTTP", value: "http" },
  { label: "Auth", value: "auth" },
  { label: "Database", value: "database" },
  { label: "Server", value: "server" },
  { label: "Process", value: "process" },
  { label: "Rate Limit", value: "rate-limit" },
  { label: "Monitoring", value: "monitoring" },
];

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function truncateValue(value: string, maxLength = 180) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function stringifyMeta(meta: Record<string, unknown> | null | undefined) {
  if (!meta || Object.keys(meta).length === 0) {
    return "";
  }

  try {
    return JSON.stringify(meta);
  } catch {
    return "";
  }
}

function getLevelBadgeClass(level: AppLogItem["level"]) {
  if (level === "fatal") {
    return "bg-red-600/15 text-red-700";
  }

  if (level === "error") {
    return "bg-rose-500/15 text-rose-700";
  }

  if (level === "warn") {
    return "bg-amber-500/15 text-amber-700";
  }

  return "bg-slate-200 text-slate-700";
}

export default function MonitoringPageClient() {
  const [items, setItems] = useState<AppLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [level, setLevel] = useState("");
  const [scope, setScope] = useState("");
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState("");
  const fetchRequestIdRef = useRef(0);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_LIMIT),
    });

    if (search) {
      params.set("search", search);
    }

    if (level) {
      params.set("level", level);
    }

    if (scope) {
      params.set("scope", scope);
    }

    return params.toString();
  }, [level, page, scope, search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setSearch(searchDraft.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchDraft]);

  useEffect(() => {
    let isCancelled = false;

    async function fetchLogs(silent = false) {
      const requestId = fetchRequestIdRef.current + 1;
      fetchRequestIdRef.current = requestId;

      if (!silent) {
        setLoading(true);
      } else {
        setPolling(true);
      }

      try {
        const response = await fetch(`/api/app-logs?${queryString}`, {
          method: "GET",
          cache: "no-store",
        });
        const data = (await response.json()) as Partial<AppLogResponse> & {
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.message || "Gagal memuat monitoring logs");
        }

        if (isCancelled || requestId !== fetchRequestIdRef.current) {
          return;
        }

        setItems(Array.isArray(data.items) ? data.items : []);
        setPage(data.page || 1);
        setTotalItems(data.totalItems || 0);
        setTotalPages(data.totalPages || 1);
        setError("");
      } catch (fetchError) {
        if (isCancelled || requestId !== fetchRequestIdRef.current) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Gagal memuat monitoring logs"
        );
      } finally {
        if (!isCancelled && requestId === fetchRequestIdRef.current) {
          setLoading(false);
          setPolling(false);
        }
      }
    }

    void fetchLogs(false);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void fetchLogs(true);
    }, 10000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [queryString]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Monitoring</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pantau error, warning, request lambat, dan kendala operasional terbaru.
        </p>
      </div>

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Cari Log
            </label>
            <input
              type="text"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Cari pesan, path, request id, invoice, email..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Level
            </label>
            <select
              value={level}
              onChange={(event) => {
                setPage(1);
                setLevel(event.target.value);
              }}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              {levelOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Scope
            </label>
            <select
              value={scope}
              onChange={(event) => {
                setPage(1);
                setScope(event.target.value);
              }}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              {scopeOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <p>{polling ? "Auto update sedang menyegarkan log terbaru." : "Auto update aktif setiap 10 detik saat tab terbuka."}</p>
          <p>{totalItems > 0 ? `${totalItems} log ditemukan` : "Belum ada log yang cocok."}</p>
        </div>
      </Card>

      {error ? (
        <Card className="border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Pesan</th>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    Memuat monitoring logs...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    Belum ada log yang cocok untuk filter saat ini.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const metaText = stringifyMeta(item.meta);
                  const requestDetails = [
                    item.method,
                    item.path,
                    item.statusCode ? `HTTP ${item.statusCode}` : "",
                    item.durationMs ? `${item.durationMs} ms` : "",
                    item.requestId ? `RID ${item.requestId}` : "",
                    item.actor?.email ? `Admin ${item.actor.email}` : "",
                  ]
                    .filter(Boolean)
                    .join(" • ");

                  return (
                    <tr key={item._id} className="align-top">
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getLevelBadgeClass(
                            item.level
                          )}`}
                        >
                          {item.level}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium uppercase tracking-[0.14em] text-slate-600">
                        {item.scope || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-900">
                        <p className="font-medium leading-6">{item.message}</p>
                        {item.error?.name || item.error?.code ? (
                          <p className="mt-1 text-xs text-rose-600">
                            {[item.error?.name, item.error?.code]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-xs leading-5 text-slate-500">
                        {requestDetails || "-"}
                      </td>
                      <td className="px-4 py-4 text-xs leading-5 text-slate-500">
                        {metaText ? truncateValue(metaText, 220) : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-4">
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            limit={PAGE_LIMIT}
            itemLabel="log"
            onPageChange={setPage}
          />
        </div>
      </Card>
    </div>
  );
}
