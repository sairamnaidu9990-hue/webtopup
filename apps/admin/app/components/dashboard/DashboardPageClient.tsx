"use client";

import { useEffect, useState } from "react";
import Card from "@/app/components/ui/Card";
import SectionTitle from "@/app/components/ui/SectionTitle";
import { getResponseMessage, parseJsonSafely } from "@/app/lib/http";
import type { VisitorAnalyticsSummary } from "@/app/types/Analytics";
import type { Order, OrderDashboardSummary } from "@/app/types/Order";

const emptyDashboard: OrderDashboardSummary = {
  totalOrders: 0,
  totalBasePrice: 0,
  totalSellPrice: 0,
  totalPromoDiscount: 0,
  totalPaymentFee: 0,
  totalProfit: 0,
  recentOrders: [],
};

const emptyAnalytics: VisitorAnalyticsSummary = {
  todayVisitors: 0,
  todayPageviews: 0,
  last7DaysVisitors: 0,
  last7DaysPageviews: 0,
  topPages: [],
  topReferrers: [],
  topDevices: [],
};

function formatMoney(value = 0, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value?: string) {
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

function formatAnalyticsPath(path?: string) {
  const rawPath = String(path || "").trim();

  if (!rawPath) {
    return "/";
  }

  let pathname = rawPath;

  try {
    pathname = decodeURIComponent(
      new URL(rawPath, "https://kitagg.com").pathname || rawPath
    );
  } catch {
    pathname = rawPath;
  }

  const compactPath = pathname.replace(/\/+/g, "/");

  if (compactPath.length <= 52) {
    return compactPath;
  }

  return `${compactPath.slice(0, 49)}...`;
}

function getStatusTone(status?: string) {
  switch (status) {
    case "SUCCESS":
    case "PAID":
      return "bg-green-100 text-green-700";
    case "FAILED":
    case "EXPIRED":
      return "bg-red-100 text-red-700";
    case "PROCESSING":
      return "bg-amber-100 text-amber-700";
    case "REFUNDED":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function SummaryCardValue({ loading, value }: { loading: boolean; value: string }) {
  if (loading) {
    return <div className="h-9 w-24 animate-pulse rounded-2xl bg-white/35" />;
  }

  return (
    <p className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
      {value}
    </p>
  );
}

function RecentOrdersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
        >
          <div className="animate-pulse space-y-3">
            <div className="h-5 w-44 rounded-xl bg-gray-200" />
            <div className="h-4 w-72 max-w-full rounded-xl bg-gray-200" />
            <div className="grid gap-2 lg:grid-cols-[1fr_220px]">
              <div className="h-4 w-40 rounded-xl bg-gray-200" />
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="h-12 rounded-2xl bg-white" />
                <div className="h-12 rounded-2xl bg-white" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPageClient() {
  const [dashboard, setDashboard] = useState<OrderDashboardSummary>(emptyDashboard);
  const [analytics, setAnalytics] = useState<VisitorAnalyticsSummary>(emptyAnalytics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [dashboardResponse, analyticsResponse] = await Promise.all([
          fetch("/api/orders/dashboard", {
            cache: "no-store",
          }),
          fetch("/api/analytics/summary", {
            cache: "no-store",
          }),
        ]);
        const [dashboardPayload, analyticsPayload] = await Promise.all([
          parseJsonSafely<OrderDashboardSummary & { message?: string }>(
            dashboardResponse
          ),
          parseJsonSafely<VisitorAnalyticsSummary>(analyticsResponse),
        ]);

        if (!dashboardResponse.ok) {
          throw new Error(
            getResponseMessage(dashboardPayload, "Gagal ambil ringkasan dashboard")
          );
        }

        if (!analyticsResponse.ok) {
          throw new Error(
            getResponseMessage(
              analyticsPayload,
              "Gagal ambil analytics pengunjung website"
            )
          );
        }

        const safePayload = dashboardPayload || emptyDashboard;
        const safeAnalytics = analyticsPayload || emptyAnalytics;

        setDashboard({
          totalOrders: Number(safePayload.totalOrders || 0),
          totalBasePrice: Number(safePayload.totalBasePrice || 0),
          totalSellPrice: Number(safePayload.totalSellPrice || 0),
          totalPromoDiscount: Number(safePayload.totalPromoDiscount || 0),
          totalPaymentFee: Number(safePayload.totalPaymentFee || 0),
          totalProfit: Number(safePayload.totalProfit || 0),
          recentOrders: Array.isArray(safePayload.recentOrders)
            ? safePayload.recentOrders
            : [],
        });
        setAnalytics({
          todayVisitors: Number(safeAnalytics.todayVisitors || 0),
          todayPageviews: Number(safeAnalytics.todayPageviews || 0),
          last7DaysVisitors: Number(safeAnalytics.last7DaysVisitors || 0),
          last7DaysPageviews: Number(safeAnalytics.last7DaysPageviews || 0),
          topPages: Array.isArray(safeAnalytics.topPages)
            ? safeAnalytics.topPages
            : [],
          topReferrers: Array.isArray(safeAnalytics.topReferrers)
            ? safeAnalytics.topReferrers
            : [],
          topDevices: Array.isArray(safeAnalytics.topDevices)
            ? safeAnalytics.topDevices
            : [],
          generatedAt: safeAnalytics.generatedAt,
        });
      } catch (fetchError) {
        setDashboard(emptyDashboard);
        setAnalytics(emptyAnalytics);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Gagal ambil ringkasan dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboard();
  }, []);

  const summaryCards = [
    {
      title: "Total Order Sukses",
      value: String(dashboard.totalOrders),
      variant: "info" as const,
    },
    {
      title: "Total Baseprice / Modal",
      value: formatMoney(dashboard.totalBasePrice),
      variant: "warning" as const,
    },
    {
      title: "Total Harga Jual",
      value: formatMoney(dashboard.totalSellPrice),
      variant: "success" as const,
    },
    {
      title: "Total Nominal Promo",
      value: formatMoney(dashboard.totalPromoDiscount),
      variant: "danger" as const,
    },
    {
      title: "Total Fee",
      value: formatMoney(dashboard.totalPaymentFee),
      variant: "warning" as const,
    },
    {
      title: "Total Profit",
      value: formatMoney(dashboard.totalProfit),
      variant: "info" as const,
    },
  ];

  const analyticsCards = [
    {
      title: "Visitor Hari Ini",
      value: String(analytics.todayVisitors),
      variant: "success" as const,
    },
    {
      title: "Pageview Hari Ini",
      value: String(analytics.todayPageviews),
      variant: "info" as const,
    },
    {
      title: "Visitor 7 Hari",
      value: String(analytics.last7DaysVisitors),
      variant: "warning" as const,
    },
    {
      title: "Pageview 7 Hari",
      value: String(analytics.last7DaysPageviews),
      variant: "danger" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Dashboard"
        subtitle="Ringkasan operasional berdasarkan transaksi yang sudah sukses, agar nilai modal, harga jual, dan profit lebih akurat."
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {summaryCards.map((item) => (
            <Card key={item.title} title={item.title} variant={item.variant}>
              <SummaryCardValue loading={loading} value={item.value} />
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {analyticsCards.map((item) => (
            <Card key={item.title} title={item.title} variant={item.variant}>
              <SummaryCardValue loading={loading} value={item.value} />
            </Card>
          ))}
        </div>

        <div className="grid gap-6">
          <div className="grid gap-6 xl:grid-cols-3">
            <Card title="Halaman Terpopuler 7 Hari">
              {loading ? (
                <RecentOrdersSkeleton />
              ) : analytics.topPages.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Belum ada data halaman yang cukup untuk ditampilkan.
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics.topPages.map((item) => (
                    <div
                      key={item.path}
                      className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                    >
                      <p
                        title={item.path}
                        className="w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-gray-900"
                      >
                        {formatAnalyticsPath(item.path)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>Pageview: {item.pageviews}</span>
                        <span>Visitor: {item.uniqueVisitors}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Referrer Teratas 7 Hari">
              {loading ? (
                <RecentOrdersSkeleton />
              ) : analytics.topReferrers.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Belum ada sumber kunjungan yang tercatat.
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics.topReferrers.map((item) => (
                    <div
                      key={item.source}
                      className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                    >
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {item.source}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>Kunjungan: {item.visits}</span>
                        <span>Visitor: {item.uniqueVisitors}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Perangkat Pengunjung 7 Hari">
              {loading ? (
                <RecentOrdersSkeleton />
              ) : analytics.topDevices.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Belum ada data perangkat pengunjung.
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics.topDevices.map((item) => (
                    <div
                      key={item.deviceType}
                      className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                    >
                      <p className="truncate text-sm font-semibold uppercase text-gray-900">
                        {item.deviceType}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>Kunjungan: {item.visits}</span>
                        <span>Visitor: {item.uniqueVisitors}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card title="10 Order Terbaru">
            <div className="space-y-3">
            {loading ? (
              <RecentOrdersSkeleton />
            ) : dashboard.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500">
                Belum ada order yang tersimpan.
              </p>
            ) : (
              dashboard.recentOrders.map((order: Order) => (
                <div
                  key={order._id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {order.invoiceNumber}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {order.gameSnapshot?.name || "-"}{" "}
                        <span className="text-gray-400">•</span>{" "}
                        {order.variantSnapshot?.name || "-"}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        {order.paymentMethodName || "-"}{" "}
                        <span className="text-gray-300">•</span>{" "}
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusTone(
                          order.status
                        )}`}
                      >
                        {order.status || "UNPAID"}
                      </span>
                      <div className="text-left text-[11px] text-gray-500 lg:text-right">
                        <p>
                          Harga Jual:{" "}
                          <span className="font-medium text-gray-700">
                            {formatMoney(
                              order.price?.sellPrice || 0,
                              order.price?.currency || "IDR"
                            )}
                          </span>
                        </p>
                        <p className="mt-1">
                          Modal:{" "}
                          <span className="font-medium text-gray-700">
                            {formatMoney(
                              order.price?.buyPrice || 0,
                              order.price?.currency || "IDR"
                            )}
                          </span>
                        </p>
                        <p className="mt-1">
                          Profit:{" "}
                          <span className="font-medium text-gray-700">
                            {formatMoney(
                              order.price?.profit || 0,
                              order.price?.currency || "IDR"
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
