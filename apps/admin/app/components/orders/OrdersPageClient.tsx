"use client";

import { useDeferredValue, useEffect, useState } from "react";
import Card from "@/app/components/ui/Card";
import PaginationControls from "@/app/components/ui/PaginationControls";
import SectionTitle from "@/app/components/ui/SectionTitle";
import { getResponseMessage, parseJsonSafely } from "@/app/lib/http";
import type { Order, OrderSummary } from "@/app/types/Order";

const PAGE_LIMIT = 20;
const ORDER_STATUS_OPTIONS = [
  "ALL",
  "UNPAID",
  "PAID",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
  "EXPIRED",
] as const;
const PAYMENT_STATUS_OPTIONS = [
  "ALL",
  "UNPAID",
  "PAID",
  "FAILED",
  "EXPIRED",
  "REFUNDED",
] as const;

const emptySummary: OrderSummary = {
  totalOrders: 0,
  successOrders: 0,
  failedOrders: 0,
  processingOrders: 0,
};

function formatMoney(currency = "IDR", value = 0) {
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

export default function OrdersPageClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<OrderSummary>(emptySummary);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof ORDER_STATUS_OPTIONS)[number]>("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<(typeof PAYMENT_STATUS_OPTIONS)[number]>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const deferredSearch = useDeferredValue(search);

  const fetchOrders = async () => {
    try {
      setError("");
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_LIMIT),
      });

      if (deferredSearch.trim()) {
        params.set("search", deferredSearch.trim());
      }

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      if (paymentStatusFilter !== "ALL") {
        params.set("paymentStatus", paymentStatusFilter);
      }

      const response = await fetch(`/api/orders?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = await parseJsonSafely<{
        items?: Order[];
        summary?: OrderSummary;
        totalItems?: number;
        totalPages?: number;
        page?: number;
        message?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal ambil data order"));
      }

      setOrders(Array.isArray(payload?.items) ? payload.items : []);
      setSummary(payload?.summary || emptySummary);
      setTotalItems(Number(payload?.totalItems || 0));
      setTotalPages(Number(payload?.totalPages || 1));
      setPage(Number(payload?.page || 1));
    } catch (fetchError) {
      setOrders([]);
      setSummary(emptySummary);
      setTotalItems(0);
      setTotalPages(1);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Gagal ambil data order"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [page, deferredSearch, statusFilter, paymentStatusFilter]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Orders"
        subtitle="Pusat monitoring transaksi internal untuk menyiapkan alur payment gateway, submit ke BangJeff, dan rekonsiliasi status order berikutnya."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Total Orders" variant="info">
          <p className="text-4xl font-bold tracking-tight">
            {summary.totalOrders}
          </p>
        </Card>

        <Card title="Success" variant="success">
          <p className="text-4xl font-bold tracking-tight">
            {summary.successOrders}
          </p>
        </Card>

        <Card title="Failed" variant="danger">
          <p className="text-4xl font-bold tracking-tight">
            {summary.failedOrders}
          </p>
        </Card>

        <Card title="Processing" variant="warning">
          <p className="text-4xl font-bold tracking-tight">
            {summary.processingOrders}
          </p>
        </Card>
      </div>

      <Card title="Daftar Order">
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cari Order
              </label>
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Invoice, ref provider, game, customer"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status Order
              </label>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value as (typeof ORDER_STATUS_OPTIONS)[number]
                  );
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
              >
                {ORDER_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL" ? "Semua status" : status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status Pembayaran
              </label>
              <select
                value={paymentStatusFilter}
                onChange={(event) => {
                  setPaymentStatusFilter(
                    event.target.value as (typeof PAYMENT_STATUS_OPTIONS)[number]
                  );
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
              >
                {PAYMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL" ? "Semua pembayaran" : status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Memuat data order...</p>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              Belum ada data order yang tersimpan.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200">
              <div className="hidden grid-cols-[1.2fr_1.1fr_1fr_0.8fr_0.8fr_0.9fr] gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 lg:grid">
                <span>Invoice</span>
                <span>Game & Customer</span>
                <span>Variant</span>
                <span>Harga</span>
                <span>Status</span>
                <span>Dibuat</span>
              </div>

              <div className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="grid gap-4 px-5 py-4 lg:grid-cols-[1.2fr_1.1fr_1fr_0.8fr_0.8fr_0.9fr] lg:items-start"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {order.invoiceNumber}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Provider: {order.provider || "bangjeff"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Ref: {order.providerReferenceNumber || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        {order.gameSnapshot?.name || "-"}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {order.customerDisplay || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-gray-900">
                        {order.variantSnapshot?.name || "-"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {order.variantSnapshot?.providerCode || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        {formatMoney(
                          order.price?.currency || "IDR",
                          order.price?.sellPrice || 0
                        )}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Profit{" "}
                        {formatMoney(
                          order.price?.currency || "IDR",
                          order.price?.profit || 0
                        )}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(
                          order.status
                        )}`}
                      >
                        {order.status || "UNPAID"}
                      </span>
                      <div>
                        <p className="text-xs text-gray-500">
                          Payment: {order.paymentStatus || "UNPAID"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Provider: {order.providerStatus || "PENDING"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(order.createdAt)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {order.paymentMethodName || "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            limit={PAGE_LIMIT}
            itemLabel="order"
            onPageChange={setPage}
          />
        </div>
      </Card>
    </div>
  );
}
