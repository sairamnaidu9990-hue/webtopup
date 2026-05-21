"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Card from "@/app/components/ui/Card";
import SectionTitle from "@/app/components/ui/SectionTitle";
import { getResponseMessage, parseJsonSafely } from "@/app/lib/http";
import type { WorkspaceFile } from "@/app/types/Workspace";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_FILE_TYPES =
  "image/*,.pdf,.txt,.csv,.zip,.doc,.docx,.xls,.xlsx";

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(value: number) {
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (value >= 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${value} B`;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("File tidak berhasil dibaca"));
      }
    };

    reader.onerror = () => reject(new Error("File tidak berhasil dibaca"));
    reader.readAsDataURL(file);
  });
}

function isImageFile(file: WorkspaceFile) {
  return file.kind === "image" || file.mimeType.startsWith("image/");
}

function FileGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-gray-200 bg-gray-50 p-4"
        >
          <div className="animate-pulse space-y-4">
            <div className="aspect-[4/3] rounded-2xl bg-white" />
            <div className="h-4 w-2/3 rounded-xl bg-gray-200" />
            <div className="h-3 w-1/2 rounded-xl bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WorkspaceFileManagerPageClient() {
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/workspace/files", {
        cache: "no-store",
      });
      const payload = await parseJsonSafely<{ items?: WorkspaceFile[]; message?: string }>(
        response
      );

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal mengambil file internal"));
      }

      const items = Array.isArray(payload?.items) ? payload.items : [];
      setFiles(items);
      setSelectedFileId((current) => {
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
          : "Gagal mengambil file internal"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFiles();
  }, [fetchFiles]);

  const selectedFile = useMemo(
    () => files.find((item) => item.id === selectedFileId) || null,
    [files, selectedFileId]
  );

  useEffect(() => {
    setRenameValue(selectedFile?.name || "");
  }, [selectedFile]);

  const filteredFiles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return files.filter((file) => {
      if (!normalizedSearch) {
        return true;
      }

      return [file.name, file.mimeType, file.uploadedBy?.name || ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [files, search]);

  const imageCount = useMemo(
    () => files.filter((item) => isImageFile(item)).length,
    [files]
  );

  const handleFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    if (nextFile.size > MAX_FILE_SIZE_BYTES) {
      setError("Ukuran file maksimal 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setFeedback("");
      setError("");

      const dataUrl = await readFileAsDataUrl(nextFile);
      const response = await fetch("/api/workspace/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nextFile.name,
          mimeType: nextFile.type || "application/octet-stream",
          size: nextFile.size,
          dataUrl,
        }),
      });
      const payload = await parseJsonSafely<{
        item?: WorkspaceFile;
        message?: string;
      }>(response);

      if (!response.ok || !payload?.item) {
        throw new Error(getResponseMessage(payload, "Gagal mengunggah file"));
      }

      setFiles((current) => [payload.item as WorkspaceFile, ...current]);
      setSelectedFileId(payload.item.id);
      setFeedback(payload.message || "File berhasil diunggah");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Gagal mengunggah file"
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleRename = async () => {
    if (!selectedFile) {
      return;
    }

    try {
      setRenaming(true);
      setFeedback("");
      setError("");

      const response = await fetch(`/api/workspace/files/${selectedFile.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: renameValue,
        }),
      });
      const payload = await parseJsonSafely<{
        item?: WorkspaceFile;
        message?: string;
      }>(response);

      if (!response.ok || !payload?.item) {
        throw new Error(getResponseMessage(payload, "Gagal mengganti nama file"));
      }

      setFiles((current) =>
        current.map((item) => (item.id === payload.item?.id ? payload.item : item))
      );
      setFeedback(payload.message || "Nama file berhasil diperbarui");
    } catch (renameError) {
      setError(
        renameError instanceof Error
          ? renameError.message
          : "Gagal mengganti nama file"
      );
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) {
      return;
    }

    const confirmed = window.confirm(
      `Hapus file "${selectedFile.name}" dari file manager internal?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setFeedback("");
      setError("");

      const response = await fetch(`/api/workspace/files/${selectedFile.id}`, {
        method: "DELETE",
      });
      const payload = await parseJsonSafely<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal menghapus file"));
      }

      const nextFiles = files.filter((item) => item.id !== selectedFile.id);
      setFiles(nextFiles);
      setSelectedFileId(nextFiles[0]?.id || null);
      setFeedback(payload?.message || "File berhasil dihapus");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Gagal menghapus file"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Workspace File Manager"
        subtitle="Pusat dokumen."
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
        <Card title="Total File" variant="info">
          <p className="text-4xl font-bold tracking-tight">{files.length}</p>
        </Card>
        <Card title="Total Gambar" variant="success">
          <p className="text-4xl font-bold tracking-tight">{imageCount}</p>
        </Card>
        <Card title="Storage Terlihat" variant="warning">
          <p className="text-lg font-semibold">
            {formatFileSize(files.reduce((sum, item) => sum + Number(item.size || 0), 0))}
          </p>
          <p className="mt-2 text-sm text-white/80">Maksimal 5 MB per file.</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <Card title="Koleksi File">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama file atau tipe dokumen"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileSelection}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center justify-center rounded-xl bg-[#d33b3b] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Mengunggah..." : "Upload File"}
              </button>
            </div>

            {loading ? (
              <FileGridSkeleton />
            ) : filteredFiles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                Belum ada file yang cocok dengan pencarianmu.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredFiles.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setSelectedFileId(file.id)}
                    className={`overflow-hidden rounded-3xl border text-left transition ${
                      selectedFileId === file.id
                        ? "border-black bg-gray-50"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden border-b border-gray-200 bg-[#f4f5f7]">
                      {isImageFile(file) ? (
                        <Image
                          src={file.dataUrl}
                          alt={file.name}
                          fill
                          sizes="360px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <div className="rounded-3xl border border-white bg-white px-5 py-4 text-center shadow-sm">
                            <p className="text-sm font-semibold text-gray-900">
                              {file.mimeType.split("/")[1]?.toUpperCase() || "FILE"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 px-4 py-4">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">{file.mimeType}</p>
                      <p className="text-xs text-gray-400">
                        {file.uploadedBy?.name || "Admin"} • {formatDateTime(file.createdAt)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card title={selectedFile ? "Detail File" : "Preview File"}>
          {!selectedFile ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
              Pilih salah satu file di kiri untuk lihat preview, rename, download, atau hapus.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-[#f4f5f7]">
                <div className="relative aspect-[4/3]">
                  {isImageFile(selectedFile) ? (
                    <Image
                      src={selectedFile.dataUrl}
                      alt={selectedFile.name}
                      fill
                      sizes="420px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="rounded-3xl border border-white bg-white px-6 py-5 text-center shadow-sm">
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedFile.mimeType.split("/")[1]?.toUpperCase() || "FILE"}
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nama File</label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition focus:border-black md:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => void handleRename()}
                      disabled={renaming}
                      className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {renaming ? "Menyimpan..." : "Rename"}
                    </button>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <dt className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
                      Tipe
                    </dt>
                    <dd className="mt-2 text-sm font-semibold text-gray-900">
                      {selectedFile.mimeType}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <dt className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
                      Ukuran
                    </dt>
                    <dd className="mt-2 text-sm font-semibold text-gray-900">
                      {formatFileSize(selectedFile.size)}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <dt className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
                      Upload Oleh
                    </dt>
                    <dd className="mt-2 text-sm font-semibold text-gray-900">
                      {selectedFile.uploadedBy?.name || "Admin"}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <dt className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
                      Dibuat
                    </dt>
                    <dd className="mt-2 text-sm font-semibold text-gray-900">
                      {formatDateTime(selectedFile.createdAt)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={selectedFile.dataUrl}
                  download={selectedFile.name}
                  className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Download File
                </a>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                  className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Menghapus..." : "Hapus File"}
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
