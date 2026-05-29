"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";

import SectionTitle from "@/app/components/ui/SectionTitle";
import { getResponseMessage, parseJsonSafely } from "@/app/lib/http";
import type { AdminArticle } from "@/app/types/Article";

const PAGE_LIMIT = 20;
const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  status: "DRAFT" as "DRAFT" | "PUBLISHED",
  isFeatured: false,
  sortOrder: "9999",
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

function buildStatusTone(status: string) {
  return status === "PUBLISHED"
    ? "bg-emerald-50 text-emerald-700"
    : "bg-amber-50 text-amber-700";
}

export default function ArticlesPageClient() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState(emptyForm);

  const deferredSearch = useDeferredValue(search);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_LIMIT),
      });

      if (deferredSearch.trim()) {
        params.set("search", deferredSearch.trim());
      }

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/articles?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = await parseJsonSafely<{
        items?: AdminArticle[];
        totalItems?: number;
        totalPages?: number;
        page?: number;
        message?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal mengambil artikel"));
      }

      setArticles(Array.isArray(payload?.items) ? payload.items : []);
      setTotalItems(Number(payload?.totalItems || 0));
      setTotalPages(Number(payload?.totalPages || 1));
      setPage(Number(payload?.page || 1));
    } catch (fetchError) {
      setArticles([]);
      setTotalItems(0);
      setTotalPages(1);
      setError(
        fetchError instanceof Error ? fetchError.message : "Gagal mengambil artikel"
      );
    } finally {
      setLoading(false);
    }
  }, [page, deferredSearch, statusFilter]);

  useEffect(() => {
    void fetchArticles();
  }, [fetchArticles]);

  const publishedCount = useMemo(
    () => articles.filter((item) => item.status === "PUBLISHED").length,
    [articles]
  );
  const featuredCount = useMemo(
    () => articles.filter((item) => item.isFeatured).length,
    [articles]
  );

  const handleEdit = (article: AdminArticle) => {
    setEditingId(article._id);
    setForm({
      title: article.title || "",
      slug: article.slug || "",
      excerpt: article.excerpt || "",
      content: article.content || "",
      coverImageUrl: article.coverImageUrl || "",
      status: article.status || "DRAFT",
      isFeatured: Boolean(article.isFeatured),
      sortOrder: String(article.sortOrder ?? 9999),
    });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus artikel ini?")) return;

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: "DELETE",
      });
      const payload = await parseJsonSafely<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal menghapus artikel"));
      }

      if (articles.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        void fetchArticles();
      }
    } catch (deleteError) {
      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Gagal menghapus artikel"
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      setFeedback("");

      const url = editingId ? `/api/articles/${editingId}` : "/api/articles";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          sortOrder: Number(form.sortOrder || 9999),
        }),
      });
      const payload = await parseJsonSafely<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal menyimpan artikel"));
      }

      setFeedback(
        editingId
          ? "Artikel berhasil diperbarui"
          : "Artikel berhasil ditambahkan"
      );
      resetForm();
      void fetchArticles();
      setTimeout(() => setFeedback(""), 3000);
    } catch (submitError) {
      alert(
        submitError instanceof Error
          ? submitError.message
          : "Gagal menyimpan artikel"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Articles"
        subtitle="Kelola artikel homepage dan halaman berita game dari admin KITAGG."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[24px] border border-sky-500/20 bg-gradient-to-r from-sky-600 to-[#1b2430] p-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
          <p className="text-xs font-semibold tracking-wide text-white/90">Total Artikel</p>
          <p className="mt-3 text-4xl font-bold tracking-tight">{totalItems}</p>
        </div>
        <div className="rounded-[24px] border border-green-500/20 bg-gradient-to-r from-green-600 to-[#1b2430] p-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
          <p className="text-xs font-semibold tracking-wide text-white/90">Published</p>
          <p className="mt-3 text-4xl font-bold tracking-tight">{publishedCount}</p>
        </div>
        <div className="rounded-[24px] border border-amber-500/20 bg-gradient-to-r from-amber-600 to-[#1b2430] p-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
          <p className="text-xs font-semibold tracking-wide text-white/90">Featured</p>
          <p className="mt-3 text-4xl font-bold tracking-tight">{featuredCount}</p>
        </div>
        <div className="rounded-[24px] border border-red-500/20 bg-gradient-to-r from-red-600 to-[#1b2430] p-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
          <p className="text-xs font-semibold tracking-wide text-white/90">Halaman</p>
          <p className="mt-3 text-4xl font-bold tracking-tight">{totalPages}</p>
        </div>
      </div>

      {feedback ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 shadow-[0_20px_44px_rgba(125,19,19,0.08)] sm:px-6">
          {feedback}
        </div>
      ) : null}

      {formOpen ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-[#f1d6d6] bg-white p-5 shadow-[0_20px_44px_rgba(125,19,19,0.08)] sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#241c1c]">
                {editingId ? "Edit Artikel" : "Tambah Artikel"}
              </h2>
              <p className="mt-1 text-sm text-[#7a6363]">
                Atur judul, gambar, ringkasan, dan isi artikel untuk homepage storefront.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setFormOpen(false);
              }}
              className="rounded-xl border border-[#f1d6d6] px-4 py-2 text-sm font-semibold text-[#7a4a4a] transition hover:bg-[#fff5f5]"
            >
              Tutup
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#241c1c]">Judul</label>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                className="w-full rounded-2xl border border-[#f1d6d6] px-4 py-3 text-base outline-none transition focus:border-[#d33b3b] md:text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#241c1c]">Slug</label>
              <input
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({ ...current, slug: event.target.value }))
                }
                placeholder="Kosongkan agar dibuat otomatis"
                className="w-full rounded-2xl border border-[#f1d6d6] px-4 py-3 text-base outline-none transition focus:border-[#d33b3b] md:text-sm"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium text-[#241c1c]">URL Cover Image</label>
              <input
                value={form.coverImageUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    coverImageUrl: event.target.value,
                  }))
                }
                placeholder="https://..."
                className="w-full rounded-2xl border border-[#f1d6d6] px-4 py-3 text-base outline-none transition focus:border-[#d33b3b] md:text-sm"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium text-[#241c1c]">Ringkasan</label>
              <textarea
                value={form.excerpt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, excerpt: event.target.value }))
                }
                rows={3}
                placeholder="Ringkasan singkat artikel untuk card homepage dan list artikel"
                className="w-full rounded-2xl border border-[#f1d6d6] px-4 py-3 text-base outline-none transition focus:border-[#d33b3b] md:text-sm"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium text-[#241c1c]">Isi Artikel</label>
              <textarea
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({ ...current, content: event.target.value }))
                }
                rows={14}
                placeholder="Tulis isi artikel di sini. Pisahkan paragraf dengan enter kosong."
                className="w-full rounded-2xl border border-[#f1d6d6] px-4 py-3 text-base outline-none transition focus:border-[#d33b3b] md:text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#241c1c]">Status</label>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as "DRAFT" | "PUBLISHED",
                  }))
                }
                className="w-full rounded-2xl border border-[#f1d6d6] px-4 py-3 text-base outline-none transition focus:border-[#d33b3b] md:text-sm"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#241c1c]">Urutan Tampil</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sortOrder: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-[#f1d6d6] px-4 py-3 text-base outline-none transition focus:border-[#d33b3b] md:text-sm"
              />
            </div>
          </div>

          <label className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-[#f1d6d6] bg-[#fff8f8] px-4 py-3 text-sm font-medium text-[#7a4a4a]">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isFeatured: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-[#e6bcbc] text-[#d33b3b] focus:ring-[#d33b3b]"
            />
            Tandai sebagai featured agar diprioritaskan di homepage
          </label>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-2xl bg-[#d33b3b] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(211,59,59,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Menyimpan..."
                : editingId
                  ? "Simpan Perubahan"
                  : "Buat Artikel"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-2xl border border-[#f1d6d6] px-5 py-3 text-sm font-semibold text-[#7a4a4a] transition hover:bg-[#fff5f5]"
              >
                Batal Edit
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <div className="rounded-[28px] border border-[#f1d6d6] bg-white p-5 shadow-[0_20px_44px_rgba(125,19,19,0.08)] sm:p-6">
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center justify-center rounded-2xl bg-[#d33b3b] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(211,59,59,0.22)] transition hover:brightness-110"
          >
            Tambah Artikel
          </button>
        </div>
      )}

      <div className="rounded-[28px] border border-[#f1d6d6] bg-white p-5 shadow-[0_20px_44px_rgba(125,19,19,0.08)] sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Cari judul, slug, atau ringkasan artikel"
            className="w-full rounded-2xl border border-[#f1d6d6] px-4 py-3 text-base outline-none transition focus:border-[#d33b3b] md:text-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-2xl border border-[#f1d6d6] px-4 py-3 text-base outline-none transition focus:border-[#d33b3b] md:max-w-[220px] md:text-sm"
          >
            <option value="ALL">Semua status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>

        {loading ? (
          <div className="mt-5 rounded-[24px] border border-[#f1d6d6] bg-[#fffafa] px-5 py-6 text-sm text-[#7a6363]">
            Memuat daftar artikel...
          </div>
        ) : error ? (
          <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        ) : articles.length === 0 ? (
          <div className="mt-5 rounded-[24px] border border-dashed border-[#f1d6d6] bg-[#fffafa] px-5 py-8 text-center text-sm text-[#7a6363]">
            Belum ada artikel yang cocok dengan filter saat ini.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {articles.map((article) => (
              <div
                key={article._id}
                className="rounded-[24px] border border-[#f1d6d6] bg-[#fffafa] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-[#241c1c]">
                        {article.title}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${buildStatusTone(
                          article.status
                        )}`}
                      >
                        {article.status}
                      </span>
                      {article.isFeatured ? (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
                          Featured
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#7a6363]">
                      {article.excerpt || "Belum ada ringkasan artikel."}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9b7f7f]">
                      <span>Slug: /artikel/{article.slug}</span>
                      <span>{article.readingMinutes} menit baca</span>
                      <span>Urutan: {article.sortOrder}</span>
                      <span>
                        Publish: {article.publishedAt ? formatDateTime(article.publishedAt) : "-"}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-[#9b7f7f]">
                      Update terakhir oleh {article.updatedBy?.name || "Admin"} •{" "}
                      {formatDateTime(article.updatedAt)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => handleEdit(article)}
                      className="inline-flex items-center justify-center rounded-2xl border border-[#f1d6d6] px-4 py-3 text-sm font-semibold text-[#7a4a4a] transition hover:bg-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(article._id)}
                      className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#f5e6e6] pt-5">
            <p className="text-sm text-[#7a6363]">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="rounded-xl border border-[#f1d6d6] px-4 py-2 text-sm font-semibold text-[#7a4a4a] transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page >= totalPages}
                className="rounded-xl border border-[#f1d6d6] px-4 py-2 text-sm font-semibold text-[#7a4a4a] transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
