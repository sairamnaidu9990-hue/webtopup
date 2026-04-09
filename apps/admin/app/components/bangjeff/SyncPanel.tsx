"use client";

import type { CSSProperties } from "react";
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

const panelStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "28px",
  background: "linear-gradient(180deg, #ffffff 0%, #fcfcfd 100%)",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)",
};

const buttonBaseStyle: CSSProperties = {
  borderRadius: "14px",
  borderWidth: "1px",
  borderStyle: "solid",
  padding: "10px 16px",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: 1.2,
  letterSpacing: "0.01em",
  transition:
    "transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, border-color 180ms ease, color 180ms ease",
};

const feedbackBaseStyle: CSSProperties = {
  borderRadius: "18px",
  borderWidth: "1px",
  borderStyle: "solid",
  overflow: "hidden",
  boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
};

const feedbackToneStyle: Record<FeedbackProps["tone"], CSSProperties> = {
  success: {
    borderColor: "#a7f3d0",
    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
  },
  error: {
    borderColor: "#fecaca",
    background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
  },
};

function getButtonStyle(isRunning: boolean, isDisabled: boolean): CSSProperties {
  if (isDisabled && !isRunning) {
    return {
      ...buttonBaseStyle,
      borderColor: "#e2e8f0",
      background: "#f8fafc",
      color: "#94a3b8",
      boxShadow: "none",
      cursor: "not-allowed",
      transform: "none",
    };
  }

  if (isRunning) {
    return {
      ...buttonBaseStyle,
      borderColor: "#0f172a",
      background: "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
      color: "#ffffff",
      boxShadow: "0 12px 24px rgba(15, 23, 42, 0.18)",
    };
  }

  return {
    ...buttonBaseStyle,
    borderColor: "#111827",
    background: "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
    color: "#ffffff",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.12)",
  };
}

function FeedbackBanner({ tone, message }: FeedbackProps) {
  const isSuccess = tone === "success";

  return (
    <div style={{ ...feedbackBaseStyle, ...feedbackToneStyle[tone] }}>
      <div className="flex items-start gap-4 px-5 py-4">
        <div
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm"
          style={{
            backgroundColor: isSuccess ? "#059669" : "#dc2626",
          }}
        >
          {isSuccess ? "OK" : "!"}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p
              className="text-sm font-semibold"
              style={{ color: isSuccess ? "#064e3b" : "#7f1d1d" }}
            >
              {isSuccess ? "Sinkronisasi berhasil" : "Sinkronisasi gagal"}
            </p>
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                backgroundColor: isSuccess ? "#d1fae5" : "#fee2e2",
                color: isSuccess ? "#047857" : "#b91c1c",
              }}
            >
              {isSuccess ? "Berhasil" : "Error"}
            </span>
          </div>

          <p
            className="mt-1.5 text-sm leading-6"
            style={{ color: isSuccess ? "#065f46" : "#991b1b" }}
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
    <div className="p-5 sm:p-6" style={panelStyle}>
      <div className="flex flex-col gap-5">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>

        <div className="grid gap-3 pt-1 sm:grid-cols-2 xl:flex xl:flex-wrap">
          {actions.map((action) => (
            <button
              key={action.endpoint}
              type="button"
              onClick={() => runSync(action)}
              disabled={running !== null}
              className="w-full text-sm xl:w-auto"
              style={getButtonStyle(
                running === action.endpoint,
                running !== null
              )}
              onMouseEnter={(event) => {
                if (running === null) {
                  event.currentTarget.style.transform = "translateY(-1px)";
                  event.currentTarget.style.boxShadow =
                    "0 12px 22px rgba(15, 23, 42, 0.16)";
                  event.currentTarget.style.background =
                    "linear-gradient(180deg, #273244 0%, #17202f 100%)";
                }
              }}
              onMouseLeave={(event) => {
                if (running === null) {
                  const baseStyle = getButtonStyle(false, false);
                  event.currentTarget.style.transform =
                    baseStyle.transform?.toString() || "none";
                  event.currentTarget.style.boxShadow =
                    baseStyle.boxShadow?.toString() || "";
                  event.currentTarget.style.background =
                    baseStyle.background?.toString() || "";
                }
              }}
            >
              {running === action.endpoint ? "Syncing..." : action.label}
            </button>
          ))}
        </div>
      </div>

      {message || error ? (
        <div className="mt-6">
          {message ? <FeedbackBanner tone="success" message={message} /> : null}
          {error ? <FeedbackBanner tone="error" message={error} /> : null}
        </div>
      ) : null}
    </div>
  );
}
