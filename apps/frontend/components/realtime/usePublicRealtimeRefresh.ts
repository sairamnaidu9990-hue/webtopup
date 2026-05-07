"use client";

import { useEffect, useRef, useState } from "react";

import { getBackendWebSocketUrl } from "@/lib/realtime";

const DEFAULT_RECONNECT_DELAY_MS = 4000;
const DEFAULT_REFRESH_THROTTLE_MS = 1200;

type RealtimeMode = "connecting" | "live" | "fallback";

type UsePublicRealtimeRefreshOptions = {
  enabled: boolean;
  subscribeType: string;
  refreshMessageTypes: string[];
  onRefresh: () => void | Promise<void>;
  fallbackIntervalMs: number;
  reconnectDelayMs?: number;
};

export default function usePublicRealtimeRefresh({
  enabled,
  subscribeType,
  refreshMessageTypes,
  onRefresh,
  fallbackIntervalMs,
  reconnectDelayMs = DEFAULT_RECONNECT_DELAY_MS,
}: UsePublicRealtimeRefreshOptions) {
  const [mode, setMode] = useState<RealtimeMode>(
    enabled ? "connecting" : "fallback"
  );
  const refreshRef = useRef(onRefresh);
  const lastRefreshAtRef = useRef(0);

  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let disposed = false;
    let websocket: WebSocket | null = null;
    let reconnectTimer: number | undefined;
    let fallbackTimer: number | undefined;

    const runRefresh = () => {
      const now = Date.now();

      if (now - lastRefreshAtRef.current < DEFAULT_REFRESH_THROTTLE_MS) {
        return;
      }

      lastRefreshAtRef.current = now;
      void Promise.resolve(refreshRef.current());
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
          runRefresh();
        }
      }, fallbackIntervalMs);
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
          setMode("live");
          websocket?.send(
            JSON.stringify({
              type: subscribeType,
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

          if (refreshMessageTypes.includes(String(payload?.type || ""))) {
            runRefresh();
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
  }, [enabled, fallbackIntervalMs, reconnectDelayMs, refreshMessageTypes, subscribeType]);

  return {
    mode: enabled ? mode : "fallback",
  };
}
