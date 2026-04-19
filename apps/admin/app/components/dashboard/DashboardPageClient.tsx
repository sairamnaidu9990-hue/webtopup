"use client";

import { useEffect, useState } from "react";
import Card from "@/app/components/ui/Card";
import SectionTitle from "@/app/components/ui/SectionTitle";
import { getResponseMessage, parseJsonSafely } from "@/app/lib/http";
import type { Order, OrderDashboardSummary } from "@/app/types/Order";

const emptyDashboard: OrderDashboardSummary = {
  totalOrders: 0,
  totalBasePrice: 0,
  totalSellPrice: 0,
  totalProfit: 0,
  recentOrders: [],
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

export default function DashboardPageClient() {
  const [dashboard, setDashboard] = useState<OrderDashboardSummary>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/orders/dashboard", {
          cache: "no-store",
        });
        const payload = await parseJsonSafely<OrderDashboardSummary & { message?: string }>(
          response
        );

        if (!response.ok) {
          throw new Error(
            getResponseMessage(payload, "Gagal ambil ringkasan dashboard")
          );
        }

        const safePayload = payload || emptyDashboard;

        setDashboard({
          totalOrders: Number(safePayload.totalOrders || 0),
          totalBasePrice: Number(safePayload.totalBasePrice || 0),
          totalSellPrice: Number(safePayload.totalSellPrice || 0),
          totalProfit: Number(safePayload.totalProfit || 0),
          recentOrders: Array.isArray(safePayload.recentOrders)
            ? safePayload.recentOrders
            : [],
        });
      } catch (fetchError) {
        setDashboard(emptyDashboard);
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
      title: "Total Profit",
      value: formatMoney(dashboard.totalProfit),
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card key={item.title} title={item.title} variant={item.variant}>
            <p className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
              {loading ? "-" : item.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6">
        <Card title="10 Order Terbaru">
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500">Memuat order terbaru...</p>
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
