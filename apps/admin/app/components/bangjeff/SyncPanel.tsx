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

      {message ? (
        <div className="mt-4 rounded-xl bg-green-100 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
