"use client";

import useAdminRealtimeChannel from "@/app/lib/useAdminRealtimeChannel";

const FALLBACK_INTERVAL_MS = 10000;

type UseOrdersRealtimeOptions = {
  enabled: boolean;
  paused?: boolean;
  onRefresh: () => void | Promise<void>;
};

export default function useOrdersRealtime({
  enabled,
  paused = false,
  onRefresh,
}: UseOrdersRealtimeOptions) {
  return useAdminRealtimeChannel({
    enabled,
    paused,
    subscribeType: "subscribe.admin.orders",
    refreshMessageTypes: ["orders.updated"],
    onRefresh,
    fallbackIntervalMs: FALLBACK_INTERVAL_MS,
  });
}
