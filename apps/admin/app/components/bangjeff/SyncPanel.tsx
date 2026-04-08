"use client";

import { useState } from "react";

type SyncAction = {
  label: string;
  endpoint: string;
};

type Props = {
  apiBase: string;
  onSynced?: () => Promise<void> | void;
  region?: string;
  title?: string;
  description?: string;
  actions?: SyncAction[];
};

const defaultActions: SyncAction[] = [
  { label: "Sync Games", endpoint: "/api/products/sync/games" },
  { label: "Sync Details", endpoint: "/api/products/sync/details" },
  { label: "Sync Variants", endpoint: "/api/products/sync/variants" },
  { label: "Sync All", endpoint: "/api/products/sync/all" },
];

type FeedbackProps = {
  tone: "success" | "error";
  message: string;
};

function FeedbackBanner({ tone, message }: FeedbackProps) {
  const isSuccess = tone === "success";

  return (
    <div
      className={`mt-6 overflow-hidden rounded-2xl border ${
        isSuccess
          ? "border-emerald-200 bg-[linear-gradient(135deg,#f4fff7_0%,#dcfce7_100%)]"
          : "border-red-200 bg-[linear-gradient(135deg,#fff5f5_0%,#fee2e2_100%)]"
      }`}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            isSuccess
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {isSuccess ? "OK" : "!"}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={`text-sm font-semibold ${
                isSuccess ? "text-emerald-900" : "text-red-900"
              }`}
            >
              {isSuccess ? "Sync berhasil" : "Sync gagal"}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                isSuccess
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {tone}
            </span>
          </div>

          <p
            className={`mt-1 text-sm ${
              isSuccess ? "text-emerald-800" : "text-red-800"
            }`}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SyncPanel({
  apiBase,
  onSynced,
  region = "ID",
  title = "BangJeff Sync",
  description = "Tarik product, detail, dan variant terbaru dari BangJeff ke database.",
  actions = defaultActions,
}: Props) {
  const [running, setRunning] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const runSync = async (action: SyncAction) => {
    try {
      setRunning(action.endpoint);
      setError("");
      setMessage("");

      const response = await fetch(`${apiBase}${action.endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ region }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || payload.message || "Sync gagal");
      }

      setMessage(payload.message || `${action.label} berhasil`);
      await onSynced?.();
    } catch (syncError) {
      setError(
        syncError instanceof Error ? syncError.message : "Sync gagal dijalankan"
      );
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.endpoint}
              type="button"
              onClick={() => runSync(action)}
              disabled={running !== null}
              className="rounded-xl border border-black px-4 py-2 text-sm font-medium text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running === action.endpoint ? "Syncing..." : action.label}
            </button>
          ))}
        </div>
      </div>

      {message ? <FeedbackBanner tone="success" message={message} /> : null}
      {error ? <FeedbackBanner tone="error" message={error} /> : null}
    </div>
  );
}
