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
    <Card
      title="Auto Sync BangJeff"
      className="space-y-5"
      contentClassName="space-y-5"
    >
      <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#fff1f2_100%)] px-5 py-4 shadow-[0_16px_35px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Jadwal sinkronisasi otomatis harian
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Scheduler mengikuti <span className="font-semibold text-slate-700">WIB / Asia/Jakarta</span> dan akan
            berjalan sekali per hari untuk tiap aksi yang diaktifkan.
          </p>
        </div>

        <div className="rounded-full border border-red-200 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-500">
          Auto Scheduler
        </div>
      </div>

      {loading ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          Memuat pengaturan auto sync...
        </div>
      ) : form ? (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            {form.actions.map((action) => (
              <div
                key={action.key}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-[1px]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      {action.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Jalankan otomatis setiap hari pada waktu yang sudah kamu tentukan.
                    </p>
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <input
                      type="checkbox"
                      checked={action.enabled}
                      onChange={(event) =>
                        updateAction(action.key, {
                          enabled: event.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-red-500 focus:ring-red-400"
                    />
                    Aktif
                  </label>
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
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
                    className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
                  />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusTone(
                      action.lastRunStatus
                    )}`}
                  >
                    {action.lastRunStatus || "IDLE"}
                  </span>
                  <span className="text-xs text-slate-500">
                    Terakhir: {formatDateTime(action.lastRunAt)}
                  </span>
                </div>

                {action.lastError ? (
                  <div className="mt-3 rounded-[18px] border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-600">
                    {action.lastError}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Timezone scheduler:{" "}
              <span className="font-semibold text-slate-700">{form.timezone}</span>
            </p>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-[20px] bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(239,68,68,0.22)] transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
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
