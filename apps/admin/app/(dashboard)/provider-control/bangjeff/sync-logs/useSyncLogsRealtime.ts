"use client";

import useAdminRealtimeChannel from "@/app/lib/useAdminRealtimeChannel";

const FALLBACK_INTERVAL_MS = 5000;

export default function useSyncLogsRealtime({
  enabled,
  onRefresh,
}: {
  enabled: boolean;
  onRefresh: () => void | Promise<void>;
}) {
  return useAdminRealtimeChannel({
    enabled,
    subscribeType: "subscribe.admin.sync-logs",
    refreshMessageTypes: ["sync-logs.updated"],
    onRefresh,
    fallbackIntervalMs: FALLBACK_INTERVAL_MS,
  });
}
