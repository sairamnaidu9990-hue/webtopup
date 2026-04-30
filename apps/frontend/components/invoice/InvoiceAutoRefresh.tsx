"use client";

import { getBackendWebSocketUrl } from "@/lib/realtime";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = {
  enabled: boolean;
  invoiceNumber: string;
  intervalMs?: number;
  reconnectDelayMs?: number;
};

export default function InvoiceAutoRefresh({
  enabled,
  invoiceNumber,
  intervalMs = 10000,
  reconnectDelayMs = 4000,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"connecting" | "live" | "fallback">(
    enabled ? "connecting" : "fallback"
  );
  const lastRefreshAtRef = useRef(0);
  const normalizedInvoiceNumber = invoiceNumber.trim().toUpperCase();

  useEffect(() => {
    if (!enabled || !normalizedInvoiceNumber) {
      return undefined;
    }

    let disposed = false;
    let websocket: WebSocket | null = null;
    let reconnectTimer: number | undefined;
    let fallbackTimer: number | undefined;

    const refreshInvoice = () => {
      const now = Date.now();

      if (now - lastRefreshAtRef.current < 1200) {
        return;
      }

      lastRefreshAtRef.current = now;
      router.refresh();
    };

    const clearFallbackTimer = () => {
      if (fallbackTimer !== undefined) {
        window.clearInterval(fallbackTimer);
        fallbackTimer = undefined;
      }
    };

    const startFallback = () => {
      if (disposed) {
        return;
      }

      setMode("fallback");
      clearFallbackTimer();
      fallbackTimer = window.setInterval(() => {
        if (document.visibilityState === "visible") {
          refreshInvoice();
        }
      }, intervalMs);
    };

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer !== undefined) {
        return;
      }

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = undefined;
        connect();
      }, reconnectDelayMs);
    };

    const cleanupWebSocket = () => {
      if (!websocket) {
        return;
      }

      websocket.onopen = null;
      websocket.onmessage = null;
      websocket.onerror = null;
      websocket.onclose = null;

      try {
        websocket.close();
      } catch {
        // Ignore close errors during cleanup.
      }

      websocket = null;
    };

    const connect = () => {
      clearFallbackTimer();
      setMode("connecting");

      try {
        websocket = new WebSocket(getBackendWebSocketUrl());

        websocket.onopen = () => {
          clearFallbackTimer();
          setMode("live");
          websocket?.send(
            JSON.stringify({
              type: "subscribe.invoice",
              invoiceNumber: normalizedInvoiceNumber,
            })
          );
        };

        websocket.onmessage = (event) => {
          let payload = null;

          try {
            payload = JSON.parse(String(event.data || "{}"));
          } catch {
            return;
          }

          if (
            payload?.type === "invoice.updated" &&
            String(payload?.order?.invoiceNumber || "").trim().toUpperCase() ===
              normalizedInvoiceNumber
          ) {
            refreshInvoice();
          }
        };

        websocket.onerror = () => {
          cleanupWebSocket();
          startFallback();
          scheduleReconnect();
        };

        websocket.onclose = () => {
          if (disposed) {
            return;
          }

          cleanupWebSocket();
          startFallback();
          scheduleReconnect();
        };
      } catch {
        cleanupWebSocket();
        startFallback();
        scheduleReconnect();
      }
    };

    connect();

    return () => {
      disposed = true;
      clearFallbackTimer();

      if (reconnectTimer !== undefined) {
        window.clearTimeout(reconnectTimer);
      }

      cleanupWebSocket();
    };
  }, [enabled, intervalMs, invoiceNumber, normalizedInvoiceNumber, reconnectDelayMs, router]);

  if (!enabled) {
    return null;
  }

  const displayMode = normalizedInvoiceNumber ? mode : "fallback";

  return (
    <p className="text-[11px] text-white/46">
      {displayMode === "live"
        ? "Status transaksi dipantau realtime selama halaman ini terbuka."
        : displayMode === "connecting"
        ? "Sedang menyambungkan pantauan realtime transaksi..."
        : "Realtime belum tersedia. Status transaksi dicek ulang otomatis."}
    </p>
  );
}
