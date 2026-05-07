"use client";

import { useEffect, useRef, useState } from "react";

import { getBackendWebSocketUrl } from "@/lib/realtime";

const DEFAULT_RECONNECT_DELAY_MS = 4000;
const DEFAULT_REFRESH_THROTTLE_MS = 1200;

type RealtimeMode = "connecting" | "live" | "fallback";

type UseAdminRealtimeChannelOptions = {
  enabled: boolean;
  paused?: boolean;
  subscribeType: string;
  refreshMessageTypes: string[];
  onRefresh: () => void | Promise<void>;
  fallbackIntervalMs: number;
  reconnectDelayMs?: number;
};

export default function useAdminRealtimeChannel({
  enabled,
  paused = false,
  subscribeType,
  refreshMessageTypes,
  onRefresh,
  fallbackIntervalMs,
  reconnectDelayMs = DEFAULT_RECONNECT_DELAY_MS,
}: UseAdminRealtimeChannelOptions) {
  const [mode, setMode] = useState<RealtimeMode>(
    enabled ? "connecting" : "fallback"
  );
  const refreshRef = useRef(onRefresh);
  const pausedRef = useRef(paused);
  const lastRefreshAtRef = useRef(0);

  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let disposed = false;
    let websocket: WebSocket | null = null;
    let reconnectTimer: number | undefined;
    let fallbackTimer: number | undefined;
    let tokenRequest: AbortController | null = null;

    const clearFallbackTimer = () => {
      if (fallbackTimer !== undefined) {
        window.clearInterval(fallbackTimer);
        fallbackTimer = undefined;
      }
    };

    const runRefresh = () => {
      if (pausedRef.current) {
        return;
      }

      const now = Date.now();

      if (now - lastRefreshAtRef.current < DEFAULT_REFRESH_THROTTLE_MS) {
        return;
      }

      lastRefreshAtRef.current = now;
      void Promise.resolve(refreshRef.current());
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
        void connect();
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

    const connect = async () => {
      clearFallbackTimer();
      setMode("connecting");
      tokenRequest?.abort();
      tokenRequest = new AbortController();

      try {
        const response = await fetch("/api/realtime/admin-token", {
          method: "POST",
          cache: "no-store",
          signal: tokenRequest.signal,
        });
        const payload = await response.json().catch(() => ({} as { token?: string }));

        if (!response.ok || !payload?.token) {
          throw new Error("Realtime token admin belum tersedia");
        }

        if (disposed) {
          return;
        }

        websocket = new WebSocket(getBackendWebSocketUrl());

        websocket.onopen = () => {
          websocket?.send(
            JSON.stringify({
              type: "auth.admin",
              token: payload.token,
            })
          );
        };

        websocket.onmessage = (event) => {
          let message = null;

          try {
            message = JSON.parse(String(event.data || "{}"));
          } catch {
            return;
          }

          if (message?.type === "auth.success") {
            clearFallbackTimer();
            setMode("live");
            websocket?.send(
              JSON.stringify({
                type: subscribeType,
              })
            );
            return;
          }

          if (refreshMessageTypes.includes(String(message?.type || ""))) {
            runRefresh();
            return;
          }

          if (
            message?.type === "error" &&
            ["AUTH_REQUIRED", "AUTH_INVALID"].includes(String(message?.code || ""))
          ) {
            cleanupWebSocket();
            startFallback();
            scheduleReconnect();
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
      } catch (error) {
        if (disposed) {
          return;
        }

        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        cleanupWebSocket();
        startFallback();
        scheduleReconnect();
      }
    };

    void connect();

    return () => {
      disposed = true;
      tokenRequest?.abort();
      clearFallbackTimer();

      if (reconnectTimer !== undefined) {
        window.clearTimeout(reconnectTimer);
      }

      cleanupWebSocket();
    };
  }, [
    enabled,
    fallbackIntervalMs,
    reconnectDelayMs,
    refreshMessageTypes,
    subscribeType,
  ]);

  return {
    mode: enabled ? mode : "fallback",
  };
}
