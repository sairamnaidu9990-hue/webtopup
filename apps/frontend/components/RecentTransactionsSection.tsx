"use client";

import { useEffect, useState } from "react";
import type { RecentPublicOrder } from "@/lib/siteData";

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency || "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency || "IDR"} ${value}`;
  }
}

function getStatusLabel(status: string) {
  const normalizedStatus = String(status || "").trim().toUpperCase();

  switch (normalizedStatus) {
    case "UNPAID":
      return "PENDING";
    case "PAID":
      return "PAID";
    case "PROCESSING":
      return "PROCESS";
    case "SUCCESS":
      return "SUCCESS";
    case "FAILED":
      return "FAILED";
    case "REFUNDED":
      return "REFUNDED";
    case "EXPIRED":
      return "EXPIRED";
    default:
      return normalizedStatus || "-";
  }
}

function getStatusClassName(status: string) {
  const normalizedStatus = String(status || "").trim().toUpperCase();

  switch (normalizedStatus) {
    case "SUCCESS":
      return "bg-emerald-400/15 text-emerald-200";
    case "PAID":
    case "PROCESSING":
      return "bg-sky-400/15 text-sky-200";
    case "FAILED":
    case "REFUNDED":
      return "bg-rose-400/15 text-rose-200";
    case "EXPIRED":
      return "bg-amber-400/15 text-amber-200";
    default:
      return "bg-amber-400/15 text-amber-200";
  }
}

export default function RecentTransactionsSection({
  initialOrders,
}: {
  initialOrders: RecentPublicOrder[];
}) {
  const [orders, setOrders] = useState<RecentPublicOrder[]>(initialOrders);

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      try {
        const response = await fetch("/api/orders/recent?limit=10", {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => ({ items: [] }));

        if (!response.ok) {
          return;
        }

        setOrders(Array.isArray(payload.items) ? payload.items : []);
      } catch {
        return;
      }
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="rounded-[24px] border border-white/8 bg-[#1c1f26] shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
      <div className="border-b border-white/8 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[15px] font-semibold text-white">
            10 Transaksi Terbaru
          </h2>
          <p className="text-[11px] text-white/45">
            Status diperbarui otomatis selama halaman terbuka.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-[12px] text-white/78">
          <thead className="bg-white/[0.02] text-[11px] uppercase tracking-[0.14em] text-white/45">
            <tr>
              <th className="px-4 py-3 font-medium sm:px-5">Tanggal</th>
              <th className="px-4 py-3 font-medium sm:px-5">Nomor Invoice</th>
              <th className="px-4 py-3 font-medium sm:px-5">Variant</th>
              <th className="px-4 py-3 font-medium sm:px-5">No. Handphone</th>
              <th className="px-4 py-3 font-medium sm:px-5">Harga</th>
              <th className="px-4 py-3 font-medium sm:px-5">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-white/45 sm:px-5"
                >
                  Belum ada transaksi terbaru untuk ditampilkan.
                </td>
              </tr>
            ) : (
              orders.map((order, index) => (
                <tr
                  key={order._id || `${order.invoiceNumber}-${index}`}
                  className="border-t border-white/6 bg-white/[0.015] transition hover:bg-white/[0.03]"
                >
                  <td className="whitespace-nowrap px-4 py-4 text-white/84 sm:px-5">
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className="px-4 py-4 font-medium text-white sm:px-5">
                    {order.invoiceNumber}
                  </td>
                  <td className="px-4 py-4 text-white/78 sm:px-5">
                    <span className="line-clamp-2 min-w-[160px]">
                      {order.variantName || "-"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-white/78 sm:px-5">
                    {order.phoneNumber || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-white/84 sm:px-5">
                    {formatCurrency(order.totalAmount || 0, order.currency || "IDR")}
                  </td>
                  <td className="px-4 py-4 sm:px-5">
                    <span
                      className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
