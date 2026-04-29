import { cache } from "react";

import { buildFrontendApiUrl } from "@/lib/runtimeConfig";
import { normalizeStorefrontOrder } from "@/lib/site-data/normalizers";
import type { RecentPublicOrder, StorefrontOrder } from "@/lib/site-data/types";

export const getPublicOrderByInvoice = cache(
  async (invoiceNumber: string): Promise<StorefrontOrder | null> => {
    const normalizedInvoiceNumber = String(invoiceNumber || "")
      .trim()
      .toUpperCase();

    if (!normalizedInvoiceNumber) {
      return null;
    }

    try {
      const response = await fetch(
        await buildFrontendApiUrl(
          `/api/orders/invoice/${encodeURIComponent(normalizedInvoiceNumber)}`
        ),
        {
          next: {
            revalidate: 10,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch order invoice");
      }

      const payload = await response.json();
      return normalizeStorefrontOrder(payload.order);
    } catch {
      return null;
    }
  }
);

export const getRecentPublicOrders = cache(
  async (limit = 10): Promise<RecentPublicOrder[]> => {
    try {
      const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);
      const response = await fetch(
        await buildFrontendApiUrl(
          `/api/orders/recent?limit=${encodeURIComponent(String(safeLimit))}`
        ),
        {
          next: {
            revalidate: 20,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch recent public orders");
      }

      const payload = await response.json();

      return Array.isArray(payload.items)
        ? payload.items.map((item: Partial<RecentPublicOrder>) => ({
            _id: String(item?._id || "").trim(),
            invoiceNumber: String(item?.invoiceNumber || "").trim(),
            gameName: String(item?.gameName || "-").trim() || "-",
            variantName: String(item?.variantName || "-").trim() || "-",
            phoneNumber: String(item?.phoneNumber || "-").trim() || "-",
            currency: String(item?.currency || "IDR").trim().toUpperCase(),
            totalAmount: Number(item?.totalAmount || 0),
            status: String(item?.status || "").trim().toUpperCase(),
            createdAt: String(item?.createdAt || ""),
          }))
        : [];
    } catch {
      return [];
    }
  }
);
