"use client";

import { useCallback, useDeferredValue, useEffect, useState } from "react";
import Card from "@/app/components/ui/Card";
import PaginationControls from "@/app/components/ui/PaginationControls";
import SectionTitle from "@/app/components/ui/SectionTitle";
import OrderEditorDialog from "@/app/components/orders/OrderEditorDialog";
import useOrdersRealtime from "@/app/components/orders/useOrdersRealtime";
import { getResponseMessage, parseJsonSafely } from "@/app/lib/http";
import type { Order, OrderSummary } from "@/app/types/Order";

const PAGE_LIMIT = 10;
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

function getGatewayErrorMessage(order: Order) {
  const notes = order.notes?.trim() || "";
  const paymentStatus = String(order.paymentStatus || "").trim().toUpperCase();
  const gatewayProvider = String(order.paymentGateway?.provider || "")
    .trim()
    .toLowerCase();
  const rawStatus = String(order.paymentGateway?.rawStatus || "")
    .trim()
    .toUpperCase();

  const hasGatewayIssue =
    paymentStatus === "FAILED" ||
    paymentStatus === "EXPIRED" ||
    rawStatus === "ERROR" ||
    rawStatus === "FAILED" ||
    rawStatus === "EXPIRED";

  if (!hasGatewayIssue) {
    return "";
  }

  if (notes) {
    return notes;
  }

  if (gatewayProvider === "tokopay") {
    return "Transaksi Tokopay gagal dibuat, tetapi belum ada detail pesan yang tersimpan.";
  }

  return "";
}

function getProviderErrorMessage(order: Order) {
  const providerStatus = String(order.providerStatus || "").trim().toUpperCase();

  if (providerStatus !== "FAILED" && providerStatus !== "EXPIRED") {
    return "";
  }

  if (order.providerMessage?.trim()) {
    return order.providerMessage.trim();
  }

  if (
    order.notes?.trim() &&
    String(order.providerStatus || "").trim().toUpperCase() === "FAILED"
  ) {
    return order.notes.trim();
  }

  return "";
}

function getOrderIssueMessages(order: Order) {
  const gatewayMessage = getGatewayErrorMessage(order);
  const providerMessage = getProviderErrorMessage(order);

  return {
    gatewayMessage,
    providerMessage,
    hasIssues: Boolean(gatewayMessage || providerMessage),
  };
}

function canMarkManualPaid(order: Order) {
  const paymentProvider = String(
    order.paymentMethodSnapshot?.provider || ""
  ).trim().toLowerCase();
  const orderStatus = String(order.status || "").trim().toUpperCase();
  const paymentStatus = String(order.paymentStatus || "").trim().toUpperCase();

  return (
    paymentProvider === "manual" &&
    paymentStatus !== "PAID" &&
    orderStatus !== "SUCCESS" &&
    orderStatus !== "PROCESSING"
  );
}

function getTokopayInvoiceNumber(order: Order) {
  return (
    order.paymentGateway?.transactionId?.trim() ||
    order.paymentReferenceNumber?.trim() ||
    order.paymentGateway?.reference?.trim() ||
    "-"
  );
}

function formatContactPhone(order: Order) {
  const countryCode = String(order.contactDetail?.phoneCountryCode || "").trim();
  const phoneNumber = String(order.contactDetail?.phoneNumber || "").trim();

  if (!phoneNumber) {
    return "-";
  }

  return `${countryCode || "+62"} ${phoneNumber}`.trim();
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
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const deferredSearch = useDeferredValue(search);

  const fetchOrders = useCallback(async (options?: { silent?: boolean }) => {
    try {
      const silent = Boolean(options?.silent);

      if (!silent) {
        setLoading(true);
      }

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
      if (!options?.silent) {
        setOrders([]);
        setSummary(emptySummary);
        setTotalItems(0);
        setTotalPages(1);
      }
      if (!options?.silent) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Gagal ambil data order"
        );
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
        setHasLoadedOnce(true);
      }
    }
  }, [page, deferredSearch, statusFilter, paymentStatusFilter]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const realtime = useOrdersRealtime({
    enabled: true,
    paused: Boolean(updatingOrderId),
    onRefresh: () => fetchOrders({ silent: true }),
  });

  useEffect(() => {
    if (!selectedOrder) {
      return;
    }

    const nextSelectedOrder = orders.find((order) => order._id === selectedOrder._id);

    if (nextSelectedOrder && nextSelectedOrder !== selectedOrder) {
      setSelectedOrder(nextSelectedOrder);
    }
  }, [orders, selectedOrder]);

  const handleMarkPaid = async (orderId: string) => {
    try {
      setUpdatingOrderId(orderId);
      const response = await fetch(`/api/orders/${orderId}/mark-paid`, {
        method: "PATCH",
      });
      const payload = await parseJsonSafely<{ message?: string; warning?: string }>(
        response
      );

      if (!response.ok) {
        throw new Error(
          getResponseMessage(payload, "Gagal update pembayaran manual")
        );
      }

      await fetchOrders();

      if (payload?.warning) {
        alert(payload.warning);
      }
    } catch (updateError) {
      alert(
        updateError instanceof Error
          ? updateError.message
          : "Gagal update pembayaran manual"
      );
    } finally {
      setUpdatingOrderId("");
    }
  };

  const handleOrderMutated = (nextOrder?: Order) => {
    if (nextOrder) {
      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder._id === nextOrder._id ? nextOrder : currentOrder
        )
      );
      setSelectedOrder(nextOrder);
    }

    void fetchOrders({ silent: true });
  };

  const realtimeBannerText =
    realtime.mode === "live"
      ? "Realtime order aktif. Data akan ikut bergerak saat transaksi berubah."
      : realtime.mode === "connecting"
      ? "Sedang menyambungkan realtime order..."
      : "Realtime belum tersedia. Auto refresh cadangan tetap aktif setiap 10 detik.";

  const realtimeBadgeText =
    realtime.mode === "live"
      ? "Realtime aktif"
      : realtime.mode === "connecting"
      ? "Menghubungkan..."
      : "Fallback 10 detik";

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
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
            <span>{realtimeBannerText}</span>
            <span>{realtimeBadgeText}</span>
          </div>

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
                placeholder="Invoice, ref provider, game, customer, email, kontak"
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

          {!hasLoadedOnce && loading ? (
            <p className="text-sm text-gray-500">Memuat data order...</p>
          ) : error && orders.length === 0 ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              Belum ada data order yang tersimpan.
            </div>
          ) : (
            <div className="space-y-3">
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              ) : null}

              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <div className="hidden grid-cols-[1.15fr_1.1fr_1fr_0.78fr_0.82fr_0.9fr_1fr_0.5fr] gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 lg:grid">
                  <span>Invoice</span>
                  <span>Game & Customer</span>
                  <span>Variant</span>
                  <span>Harga</span>
                  <span>Status</span>
                  <span>Dibuat</span>
                  <span>KET</span>
                  <span className="text-right">Aksi</span>
                </div>

                <div className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const issueMessages = getOrderIssueMessages(order);

                    return (
                      <div key={order._id} className="px-5 py-4">
                        <div className="grid gap-4 lg:grid-cols-[1.15fr_1.1fr_1fr_0.78fr_0.82fr_0.9fr_1fr_0.5fr] lg:items-start">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {order.invoiceNumber}
                            </p>
                            <p className="mt-2 text-[11px] text-gray-500">
                              Invoice BangJeff:{" "}
                              <span className="font-medium text-gray-700">
                                {order.providerInvoiceNumber || "-"}
                              </span>
                            </p>
                            <p className="mt-1 text-[11px] text-gray-500">
                              Invoice Tokopay:{" "}
                              <span className="font-medium text-gray-700">
                                {getTokopayInvoiceNumber(order)}
                              </span>
                            </p>
                          </div>

                          <div>
                            <p className="font-semibold text-gray-900">
                              {order.gameSnapshot?.name || "-"}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              {order.customerDisplay || "-"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Kontak: {formatContactPhone(order)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Email: {order.contactDetail?.email?.trim() || "-"}
                            </p>
                          </div>

                            <div>
                              <p className="font-medium text-gray-900">
                                {order.variantSnapshot?.name || "-"}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Qty: {Math.max(Number(order.quantity || 1), 1)}x
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
                            {canMarkManualPaid(order) ? (
                              <button
                                type="button"
                                onClick={() => handleMarkPaid(order._id)}
                                disabled={updatingOrderId === order._id}
                                className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {updatingOrderId === order._id
                                  ? "Memproses..."
                                  : "Tandai Paid"}
                              </button>
                            ) : null}
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(order.createdAt)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {order.paymentMethodName || "-"}
                            </p>
                            {order.paymentGateway?.channelCode ? (
                              <p className="mt-1 text-xs text-gray-500">
                                Channel: {order.paymentGateway.channelCode}
                              </p>
                            ) : null}
                          </div>

                          <div>
                            {issueMessages.hasIssues ? (
                              <div className="space-y-3 text-xs leading-5">
                                {issueMessages.gatewayMessage ? (
                                  <div className="text-red-700">
                                    <p className="font-semibold text-red-800">
                                      Payment Gateway
                                    </p>
                                    <p className="mt-1 line-clamp-4">
                                      {issueMessages.gatewayMessage}
                                    </p>
                                  </div>
                                ) : null}

                                {issueMessages.providerMessage ? (
                                  <div className="text-amber-700">
                                    <p className="font-semibold text-amber-900">
                                      Provider BangJeff
                                    </p>
                                    <p className="mt-1 line-clamp-4">
                                      {issueMessages.providerMessage}
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex items-start justify-end">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 transition hover:border-gray-900 hover:text-gray-900"
                              aria-label={`Edit order ${order.invoiceNumber}`}
                              title="Edit order"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-4 w-4"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L8.25 19.04l-4.5 1.125L4.875 15.7 16.862 4.487z"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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

      <OrderEditorDialog
        open={Boolean(selectedOrder)}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onOrderMutated={handleOrderMutated}
      />
    </div>
  );
}
