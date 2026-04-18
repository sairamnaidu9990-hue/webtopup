"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  createdAt?: string;
  expiresAt?: string;
  paymentStatus?: string;
};

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getRemainingMs(expiresAt?: string) {
  if (!expiresAt) {
    return 0;
  }

  const expiresDate = new Date(expiresAt);

  if (Number.isNaN(expiresDate.getTime())) {
    return 0;
  }

  return Math.max(0, expiresDate.getTime() - Date.now());
}

function formatCountdown(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours} Jam ${minutes} Menit ${seconds} Detik`;
}

export default function InvoicePaymentTimer({
  createdAt,
  expiresAt,
  paymentStatus,
}: Props) {
  const normalizedPaymentStatus = String(paymentStatus || "")
    .trim()
    .toUpperCase();
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs(expiresAt));

  useEffect(() => {
    setRemainingMs(getRemainingMs(expiresAt));
  }, [expiresAt]);

  useEffect(() => {
    if (!expiresAt || normalizedPaymentStatus === "PAID" || remainingMs <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setRemainingMs(getRemainingMs(expiresAt));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [expiresAt, normalizedPaymentStatus, remainingMs]);

  const shouldShowCountdown =
    Boolean(expiresAt) &&
    normalizedPaymentStatus !== "PAID" &&
    normalizedPaymentStatus !== "SUCCESS" &&
    normalizedPaymentStatus !== "REFUNDED" &&
    remainingMs > 0;

  const label = useMemo(() => {
    if (shouldShowCountdown) {
      return formatCountdown(remainingMs);
    }

    return formatDateTime(createdAt);
  }, [createdAt, remainingMs, shouldShowCountdown]);

  return (
    <div
      className={`inline-flex min-h-[44px] items-center rounded-[14px] border px-4 py-2 text-[13px] font-semibold sm:text-[14px] ${
        shouldShowCountdown
          ? "border-[var(--accent)]/55 bg-[rgba(211,59,59,0.12)] text-white shadow-[0_10px_24px_var(--accent-glow)]"
          : "border-white/8 bg-white/5 text-white/82"
      }`}
    >
      {label}
    </div>
  );
}
