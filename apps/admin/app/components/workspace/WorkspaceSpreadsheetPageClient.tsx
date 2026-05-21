"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Card from "@/app/components/ui/Card";
import SectionTitle from "@/app/components/ui/SectionTitle";
import { getResponseMessage, parseJsonSafely } from "@/app/lib/http";
import type {
  WorkspaceSheet,
  WorkspaceSheetColumn,
  WorkspaceSheetRow,
} from "@/app/types/Workspace";

const MAX_COLUMNS = 12;
const MAX_ROWS = 200;

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildColumnId() {
  return `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function buildRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function SpreadsheetListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
        >
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 rounded-xl bg-gray-200" />
            <div className="h-3 w-full rounded-xl bg-gray-100" />
            <div className="h-3 w-1/2 rounded-xl bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WorkspaceSpreadsheetPageClient() {
  const [sheets, setSheets] = useState<WorkspaceSheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [draftSheet, setDraftSheet] = useState<WorkspaceSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const fetchSheets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/workspace/sheets", {
        cache: "no-store",
      });
      const payload = await parseJsonSafely<{ items?: WorkspaceSheet[]; message?: string }>(
        response
      );

      if (!response.ok) {
        throw new Error(
          getResponseMessage(payload, "Gagal mengambil spreadsheet internal")
        );
      }

      const items = Array.isArray(payload?.items) ? payload.items : [];
      setSheets(items);
      setSelectedSheetId((current) => {
        if (!items.length) {
          return null;
        }

        if (current && items.some((item) => item.id === current)) {
          return current;
        }

        return items[0].id;
      });
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Gagal mengambil spreadsheet internal"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSheets();
  }, [fetchSheets]);

  const selectedSheet = useMemo(
    () => sheets.find((item) => item.id === selectedSheetId) || null,
    [sheets, selectedSheetId]
  );

  useEffect(() => {
    if (!selectedSheet) {
      setDraftSheet(null);
      return;
    }

    setDraftSheet(JSON.parse(JSON.stringify(selectedSheet)) as WorkspaceSheet);
  }, [selectedSheet]);

  const handleCreate = async () => {
    try {
      setCreating(true);
      setFeedback("");
      setError("");

      const response = await fetch("/api/workspace/sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Sheet ${sheets.length + 1}`,
          description: "",
        }),
      });
      const payload = await parseJsonSafely<{
        item?: WorkspaceSheet;
        message?: string;
      }>(response);

      if (!response.ok || !payload?.item) {
        throw new Error(getResponseMessage(payload, "Gagal membuat spreadsheet"));
      }

      setSheets((current) => [payload.item as WorkspaceSheet, ...current]);
      setSelectedSheetId(payload.item.id);
      setFeedback(payload.message || "Spreadsheet berhasil dibuat");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Gagal membuat spreadsheet"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!draftSheet) {
      return;
    }

    try {
      setSaving(true);
      setFeedback("");
      setError("");

      const response = await fetch(`/api/workspace/sheets/${draftSheet.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: draftSheet.name,
          description: draftSheet.description,
          columns: draftSheet.columns,
          rows: draftSheet.rows,
        }),
      });
      const payload = await parseJsonSafely<{
        item?: WorkspaceSheet;
        message?: string;
      }>(response);

      if (!response.ok || !payload?.item) {
        throw new Error(getResponseMessage(payload, "Gagal menyimpan spreadsheet"));
      }

      setSheets((current) =>
        current.map((item) => (item.id === payload.item?.id ? payload.item : item))
      );
      setDraftSheet(payload.item);
      setFeedback(payload.message || "Spreadsheet berhasil disimpan");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Gagal menyimpan spreadsheet"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSheet) {
      return;
    }

    const confirmed = window.confirm(
      `Hapus spreadsheet "${selectedSheet.name}"? Data baris dan kolom akan hilang.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setFeedback("");
      setError("");

      const response = await fetch(`/api/workspace/sheets/${selectedSheet.id}`, {
        method: "DELETE",
      });
      const payload = await parseJsonSafely<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal menghapus spreadsheet"));
      }

      const nextSheets = sheets.filter((item) => item.id !== selectedSheet.id);
      setSheets(nextSheets);
      setSelectedSheetId(nextSheets[0]?.id || null);
      setFeedback(payload?.message || "Spreadsheet berhasil dihapus");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Gagal menghapus spreadsheet"
      );
    } finally {
      setDeleting(false);
    }
  };

  const addColumn = () => {
    if (!draftSheet || draftSheet.columns.length >= MAX_COLUMNS) {
      return;
    }

    const nextColumn: WorkspaceSheetColumn = {
      id: buildColumnId(),
      label: `Kolom ${draftSheet.columns.length + 1}`,
    };

    setDraftSheet((current) =>
      current
        ? {
            ...current,
            columns: [...current.columns, nextColumn],
            rows: current.rows.map((row) => ({
              ...row,
              cells: {
                ...row.cells,
                [nextColumn.id]: "",
              },
            })),
          }
        : current
    );
  };

  const removeColumn = (columnId: string) => {
    if (!draftSheet || draftSheet.columns.length <= 1) {
      return;
    }

    setDraftSheet((current) =>
      current
        ? {
            ...current,
            columns: current.columns.filter((column) => column.id !== columnId),
            rows: current.rows.map((row) => {
              const nextCells = { ...row.cells };
              delete nextCells[columnId];

              return {
                ...row,
                cells: nextCells,
              };
            }),
          }
        : current
    );
  };

  const addRow = () => {
    if (!draftSheet || draftSheet.rows.length >= MAX_ROWS) {
      return;
    }

    const nextRow: WorkspaceSheetRow = {
      id: buildRowId(),
      cells: Object.fromEntries(draftSheet.columns.map((column) => [column.id, ""])),
    };

    setDraftSheet((current) =>
      current
        ? {
            ...current,
            rows: [...current.rows, nextRow],
          }
        : current
    );
  };

  const removeRow = (rowId: string) => {
    if (!draftSheet || draftSheet.rows.length <= 1) {
      return;
    }

    setDraftSheet((current) =>
      current
        ? {
            ...current,
            rows: current.rows.filter((row) => row.id !== rowId),
          }
        : current
    );
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Workspace Spreadsheet"
        subtitle="Sheet kerja internal tim KITAGG untuk tracking sederhana, perencanaan mini, dan pencatatan operasional yang tidak perlu keluar dari admin."
      />

      {feedback ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Total Sheet" variant="info">
          <p className="text-4xl font-bold tracking-tight">{sheets.length}</p>
        </Card>
        <Card title="Kolom Aktif" variant="warning">
          <p className="text-4xl font-bold tracking-tight">
            {draftSheet?.columns.length || 0}
          </p>
        </Card>
        <Card title="Baris Aktif" variant="success">
          <p className="text-4xl font-bold tracking-tight">
            {draftSheet?.rows.length || 0}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card title="Daftar Spreadsheet">
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating}
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#d33b3b] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Membuat..." : "Spreadsheet Baru"}
            </button>

            {loading ? (
              <SpreadsheetListSkeleton />
            ) : sheets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                Belum ada spreadsheet internal. Buat sheet pertama untuk timmu.
              </div>
            ) : (
              <div className="space-y-3">
                {sheets.map((sheet) => (
                  <button
                    key={sheet.id}
                    type="button"
                    onClick={() => setSelectedSheetId(sheet.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      selectedSheetId === sheet.id
                        ? "border-black bg-gray-50"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {sheet.name}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                      {sheet.description || "Belum ada deskripsi spreadsheet."}
                    </p>
                    <p className="mt-3 text-xs text-gray-400">
                      {sheet.columns.length} kolom • {sheet.rows.length} baris •{" "}
                      {formatDateTime(sheet.updatedAt)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card title={draftSheet ? `Editor: ${draftSheet.name}` : "Editor Spreadsheet"}>
          {!draftSheet ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
              Pilih salah satu spreadsheet di kiri untuk mulai mengedit isinya.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nama Spreadsheet</label>
                  <input
                    type="text"
                    value={draftSheet.name}
                    onChange={(event) =>
                      setDraftSheet((current) =>
                        current
                          ? {
                              ...current,
                              name: event.target.value,
                            }
                          : current
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Deskripsi</label>
                  <input
                    type="text"
                    value={draftSheet.description}
                    onChange={(event) =>
                      setDraftSheet((current) =>
                        current
                          ? {
                              ...current,
                              description: event.target.value,
                            }
                          : current
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
                    placeholder="Contoh: Tracking task promo minggu ini"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={addColumn}
                    disabled={draftSheet.columns.length >= MAX_COLUMNS}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Tambah Kolom
                  </button>
                  <button
                    type="button"
                    onClick={addRow}
                    disabled={draftSheet.rows.length >= MAX_ROWS}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Tambah Baris
                  </button>
                </div>

                <div className="text-xs text-gray-500">
                  Maksimal {MAX_COLUMNS} kolom dan {MAX_ROWS} baris per sheet.
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="min-w-[56px] border-b border-r border-gray-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                          #
                        </th>
                        {draftSheet.columns.map((column, index) => (
                          <th
                            key={column.id}
                            className="min-w-[220px] border-b border-r border-gray-200 px-3 py-3 text-left"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={column.label}
                                onChange={(event) =>
                                  setDraftSheet((current) =>
                                    current
                                      ? {
                                          ...current,
                                          columns: current.columns.map((item) =>
                                            item.id === column.id
                                              ? {
                                                  ...item,
                                                  label: event.target.value,
                                                }
                                              : item
                                          ),
                                        }
                                      : current
                                  )
                                }
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition focus:border-black"
                              />
                              <button
                                type="button"
                                onClick={() => removeColumn(column.id)}
                                disabled={draftSheet.columns.length <= 1}
                                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={`Hapus kolom ${index + 1}`}
                              >
                                ×
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {draftSheet.rows.map((row, rowIndex) => (
                        <tr key={row.id}>
                          <td className="border-b border-r border-gray-200 bg-gray-50 px-3 py-3 align-top text-sm font-semibold text-gray-500">
                            <div className="flex items-center justify-between gap-2">
                              <span>{rowIndex + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeRow(row.id)}
                                disabled={draftSheet.rows.length <= 1}
                                className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                ×
                              </button>
                            </div>
                          </td>
                          {draftSheet.columns.map((column) => (
                            <td
                              key={`${row.id}-${column.id}`}
                              className="border-b border-r border-gray-200 px-0 py-0 align-top"
                            >
                              <textarea
                                value={row.cells[column.id] || ""}
                                onChange={(event) =>
                                  setDraftSheet((current) =>
                                    current
                                      ? {
                                          ...current,
                                          rows: current.rows.map((item) =>
                                            item.id === row.id
                                              ? {
                                                  ...item,
                                                  cells: {
                                                    ...item.cells,
                                                    [column.id]: event.target.value,
                                                  },
                                                }
                                              : item
                                          ),
                                        }
                                      : current
                                  )
                                }
                                rows={3}
                                className="w-full resize-y border-0 px-3 py-3 text-sm leading-6 text-gray-700 outline-none focus:bg-[#fff8f8]"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-gray-500">
                  Terakhir diperbarui {formatDateTime(draftSheet.updatedAt)} oleh{" "}
                  <span className="font-semibold text-gray-700">
                    {draftSheet.updatedBy?.name || "Admin"}
                  </span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleting ? "Menghapus..." : "Hapus Sheet"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Menyimpan..." : "Simpan Spreadsheet"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
