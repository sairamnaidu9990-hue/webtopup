"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Card from "@/app/components/ui/Card";
import SectionTitle from "@/app/components/ui/SectionTitle";
import { getResponseMessage, parseJsonSafely } from "@/app/lib/http";
import type { WorkspaceNote } from "@/app/types/Workspace";

const colorOptions = [
  { value: "slate", label: "Slate", accent: "bg-slate-500" },
  { value: "red", label: "Merah", accent: "bg-red-500" },
  { value: "amber", label: "Amber", accent: "bg-amber-500" },
  { value: "emerald", label: "Hijau", accent: "bg-emerald-500" },
  { value: "sky", label: "Biru", accent: "bg-sky-500" },
  { value: "violet", label: "Ungu", accent: "bg-violet-500" },
];

const emptyForm = {
  title: "",
  content: "",
  color: "slate",
  isPinned: false,
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function NoteListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
        >
          <div className="animate-pulse space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
              <div className="h-4 w-32 rounded-xl bg-gray-200" />
            </div>
            <div className="h-3 w-full rounded-xl bg-gray-100" />
            <div className="h-3 w-2/3 rounded-xl bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WorkspaceNotepadPageClient() {
  const [notes, setNotes] = useState<WorkspaceNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/workspace/notes", {
        cache: "no-store",
      });
      const payload = await parseJsonSafely<{ items?: WorkspaceNote[]; message?: string }>(
        response
      );

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal mengambil notepad internal"));
      }

      const items = Array.isArray(payload?.items) ? payload.items : [];
      setNotes(items);
      setSelectedNoteId((current) => {
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
          : "Gagal mengambil notepad internal"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  const selectedNote = useMemo(
    () => notes.find((item) => item.id === selectedNoteId) || null,
    [notes, selectedNoteId]
  );

  useEffect(() => {
    if (!selectedNote) {
      setForm(emptyForm);
      return;
    }

    setForm({
      title: selectedNote.title,
      content: selectedNote.content,
      color: selectedNote.color || "slate",
      isPinned: Boolean(selectedNote.isPinned),
    });
  }, [selectedNote]);

  const filteredNotes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return notes.filter((note) => {
      if (!normalizedSearch) {
        return true;
      }

      return [note.title, note.content, note.updatedBy?.name || ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [notes, search]);

  const pinnedCount = useMemo(
    () => notes.filter((item) => item.isPinned).length,
    [notes]
  );

  const handleCreate = async () => {
    try {
      setCreating(true);
      setFeedback("");
      setError("");

      const response = await fetch("/api/workspace/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Catatan ${notes.length + 1}`,
          content: "",
          color: "slate",
          isPinned: false,
        }),
      });
      const payload = await parseJsonSafely<{
        item?: WorkspaceNote;
        message?: string;
      }>(response);

      if (!response.ok || !payload?.item) {
        throw new Error(getResponseMessage(payload, "Gagal membuat catatan"));
      }

      setNotes((current) => [payload.item as WorkspaceNote, ...current]);
      setSelectedNoteId(payload.item.id);
      setFeedback(payload.message || "Catatan berhasil dibuat");
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : "Gagal membuat catatan"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedNoteId) {
      return;
    }

    try {
      setSaving(true);
      setFeedback("");
      setError("");

      const response = await fetch(`/api/workspace/notes/${selectedNoteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const payload = await parseJsonSafely<{
        item?: WorkspaceNote;
        message?: string;
      }>(response);

      if (!response.ok || !payload?.item) {
        throw new Error(getResponseMessage(payload, "Gagal menyimpan catatan"));
      }

      setNotes((current) =>
        current.map((item) => (item.id === payload.item?.id ? payload.item : item))
      );
      setFeedback(payload.message || "Catatan berhasil disimpan");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Gagal menyimpan catatan"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNote) {
      return;
    }

    const confirmed = window.confirm(
      `Hapus catatan "${selectedNote.title}"? Tindakan ini tidak bisa dibatalkan.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setFeedback("");
      setError("");

      const response = await fetch(`/api/workspace/notes/${selectedNote.id}`, {
        method: "DELETE",
      });
      const payload = await parseJsonSafely<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal menghapus catatan"));
      }

      const nextNotes = notes.filter((item) => item.id !== selectedNote.id);
      setNotes(nextNotes);
      setSelectedNoteId(nextNotes[0]?.id || null);
      setFeedback(payload?.message || "Catatan berhasil dihapus");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Gagal menghapus catatan"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Workspace Notepad"
        subtitle="Ruang catatan internal tim KITAGG untuk briefing cepat, SOP mini, dan ide operasional harian."
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
        <Card title="Total Catatan" variant="info">
          <p className="text-4xl font-bold tracking-tight">{notes.length}</p>
        </Card>
        <Card title="Catatan Dipin" variant="warning">
          <p className="text-4xl font-bold tracking-tight">{pinnedCount}</p>
        </Card>
        <Card title="Terakhir Diperbarui" variant="success">
          <p className="text-sm font-semibold">
            {selectedNote?.updatedAt ? formatDateTime(selectedNote.updatedAt) : "-"}
          </p>
          <p className="mt-2 text-sm text-white/80">
            {selectedNote?.updatedBy?.name || "Pilih catatan di kiri"}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card title="Daftar Catatan">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari judul atau isi catatan"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
              />
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={creating}
                className="inline-flex items-center justify-center rounded-xl bg-[#d33b3b] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? "Membuat..." : "Catatan Baru"}
              </button>
            </div>

            {loading ? (
              <NoteListSkeleton />
            ) : filteredNotes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                Belum ada catatan yang cocok dengan pencarianmu.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotes.map((note) => {
                  const colorAccent =
                    colorOptions.find((option) => option.value === note.color)?.accent ||
                    "bg-slate-500";

                  return (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => setSelectedNoteId(note.id)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                        selectedNoteId === note.id
                          ? "border-black bg-gray-50"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${colorAccent}`} />
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {note.title}
                        </p>
                        {note.isPinned ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                            Pin
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500">
                        {note.content || "Belum ada isi catatan."}
                      </p>
                      <p className="mt-3 text-xs text-gray-400">
                        {note.updatedBy?.name || "Admin"} • {formatDateTime(note.updatedAt)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Card title={selectedNote ? `Editor: ${selectedNote.title}` : "Editor Catatan"}>
          {!selectedNote ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
              Pilih catatan di kiri, atau buat catatan baru untuk mulai menulis.
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Judul Catatan</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Warna Catatan</label>
                  <select
                    value={form.color}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        color: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
                  >
                    {colorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="inline-flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isPinned: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#d33b3b] focus:ring-[#d33b3b]"
                />
                Pin catatan ini supaya tetap di atas daftar
              </label>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Isi Catatan</label>
                <textarea
                  value={form.content}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      content: event.target.value,
                    }))
                  }
                  rows={18}
                  placeholder="Tulis poin briefing, panduan singkat, atau catatan operasional tim di sini."
                  className="min-h-[360px] w-full rounded-2xl border border-gray-200 px-4 py-4 text-base leading-7 outline-none transition focus:border-black md:text-sm"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-gray-500">
                  Terakhir diperbarui {formatDateTime(selectedNote.updatedAt)} oleh{" "}
                  <span className="font-semibold text-gray-700">
                    {selectedNote.updatedBy?.name || "Admin"}
                  </span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleting ? "Menghapus..." : "Hapus Catatan"}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Menyimpan..." : "Simpan Catatan"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
