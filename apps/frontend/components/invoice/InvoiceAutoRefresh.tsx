"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  enabled: boolean;
  intervalMs?: number;
};

export default function InvoiceAutoRefresh({
  enabled,
  intervalMs = 10000,
}: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [enabled, intervalMs, router]);

  if (!enabled) {
    return null;
  }

  return (
    <p className="text-[11px] text-white/46">
      Status transaksi dicek otomatis selama halaman ini terbuka.
    </p>
  );
}
