"use client";

import { useEffect, useState } from "react";
import Card from "@/app/components/ui/Card";
import { parseJsonSafely } from "@/app/lib/http";

type AutoSyncAction = {
  key: string;
  label: string;
  enabled: boolean;
  time: string;
  lastRunAt?: string | null;
  lastRunStatus?: "IDLE" | "RUNNING" | "SUCCESS" | "FAILED";
  lastError?: string;
};

type AutoSyncSetting = {
  provider: string;
  region: string;
  timezone: string;
  actions: AutoSyncAction[];
  updatedAt?: string | null;
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Belum pernah";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusTone(status?: string) {
  switch (String(status || "").trim().toUpperCase()) {
    case "SUCCESS":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "FAILED":
      return "bg-red-50 text-red-700 ring-red-200";
    case "RUNNING":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    default:
      return "bg-gray-100 text-gray-600 ring-gray-200";
  }
}

export default function BangjeffAutoSyncCard() {
  const [form, setForm] = useState<AutoSyncSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        setLoading(true);
        setFeedback(null);

        const response = await fetch("/api/products/sync/settings?region=ID", {
          cache: "no-store",
        });
        const payload = await parseJsonSafely<{
          syncSetting?: AutoSyncSetting;
          message?: string;
          error?: string;
        }>(response);

        if (!response.ok || !payload?.syncSetting) {
          throw new Error(
            payload?.error ||
              payload?.message ||
              "Pengaturan auto sync BangJeff gagal diambil"
          );
        }

        if (active) {
          setForm(payload.syncSetting);
        }
      } catch (error) {
        if (active) {
          setFeedback({
            tone: "error",
            message:
              error instanceof Error
                ? error.message
                : "Pengaturan auto sync BangJeff gagal diambil",
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const updateAction = (
    actionKey: string,
    patch: Partial<Pick<AutoSyncAction, "enabled" | "time">>
  ) => {
    setForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        actions: current.actions.map((action) =>
          action.key === actionKey ? { ...action, ...patch } : action
        ),
      };
    });
  };

  const handleSave = async () => {
    if (!form) {
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      const response = await fetch("/api/products/sync/settings?region=ID", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timezone: form.timezone,
          actions: form.actions.map((action) => ({
            key: action.key,
            enabled: action.enabled,
            time: action.time,
          })),
        }),
      });
      const payload = await parseJsonSafely<{
        syncSetting?: AutoSyncSetting;
        message?: string;
        error?: string;
      }>(response);

      if (!response.ok || !payload?.syncSetting) {
        throw new Error(
          payload?.error ||
            payload?.message ||
            "Pengaturan auto sync BangJeff gagal disimpan"
        );
      }

      setForm(payload.syncSetting);
      setFeedback({
        tone: "success",
        message:
          payload.message || "Pengaturan auto sync BangJeff berhasil disimpan",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Pengaturan auto sync BangJeff gagal disimpan",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Auto Sync BangJeff" className="space-y-4">
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        Atur jam auto sync harian untuk katalog BangJeff. Scheduler mengikuti{" "}
        <span className="font-semibold text-gray-900">WIB</span> dan akan jalan
        sekali per hari untuk tiap aksi yang diaktifkan.
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
          Memuat pengaturan auto sync...
        </div>
      ) : form ? (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            {form.actions.map((action) => (
              <div
                key={action.key}
                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {action.label}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Jalankan otomatis setiap hari pada jam yang ditentukan.
                    </p>
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    <input
                      type="checkbox"
                      checked={action.enabled}
                      onChange={(event) =>
                        updateAction(action.key, {
                          enabled: event.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-red-500 focus:ring-red-400"
                    />
                    Aktif
                  </label>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Jam Sync
                  </label>
                  <input
                    type="time"
                    value={action.time}
                    onChange={(event) =>
                      updateAction(action.key, {
                        time: event.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusTone(
                      action.lastRunStatus
                    )}`}
                  >
                    {action.lastRunStatus || "IDLE"}
                  </span>
                  <span className="text-xs text-gray-500">
                    Terakhir: {formatDateTime(action.lastRunAt)}
                  </span>
                </div>

                {action.lastError ? (
                  <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {action.lastError}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Timezone scheduler:{" "}
              <span className="font-semibold text-gray-700">{form.timezone}</span>
            </p>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(239,68,68,0.22)] transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Auto Sync"}
            </button>
          </div>
        </>
      ) : null}

      {feedback ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            feedback.tone === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}
    </Card>
  );
}
