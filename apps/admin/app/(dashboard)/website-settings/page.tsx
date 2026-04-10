"use client";

import { useEffect, useState } from "react";
import SectionTitle from "../../components/ui/SectionTitle";
import Card from "../../components/ui/Card";
import type { SiteSetting } from "@/app/types/SiteSetting";

const defaultForm: SiteSetting = {
  siteName: "WebTopup",
  siteLogoUrl: "",
  siteFaviconUrl: "",
  siteDomain: "",
  siteTitle: "WebTopup - Top Up Game Realtime",
  siteDescription:
    "Website top up game realtime dengan katalog yang dikelola langsung dari panel admin.",
};

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function WebsiteSettingsPage() {
  const [form, setForm] = useState<SiteSetting>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/site-settings", {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.message || "Gagal mengambil pengaturan website"
        );
      }

      setForm(payload.siteSetting || defaultForm);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Gagal mengambil pengaturan website"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setSuccess("");
    setError("");

    try {
      const response = await fetch("/api/site-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteName: form.siteName,
          siteLogoUrl: form.siteLogoUrl,
          siteFaviconUrl: form.siteFaviconUrl,
          siteDomain: form.siteDomain,
          siteTitle: form.siteTitle,
          siteDescription: form.siteDescription,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.message || "Gagal memperbarui pengaturan website"
        );
      }

      setSuccess(payload.message || "Pengaturan website berhasil diperbarui");
      setForm(payload.siteSetting || form);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Gagal memperbarui pengaturan website"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Website Settings"
        subtitle="Atur nama web, logo, favicon, domain utama, site title, dan site description yang dipakai oleh frontend user."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Brand Name" variant="info">
          <p className="text-2xl font-bold tracking-tight">
            {loading ? "..." : form.siteName}
          </p>
          <p className="mt-2 text-sm text-white/80">
            Nama brand yang tampil di header frontend user
          </p>
        </Card>

        <Card title="Site Title" variant="success">
          <p className="text-lg font-semibold tracking-tight">
            {loading ? "..." : form.siteTitle}
          </p>
          <p className="mt-2 text-sm text-white/80">
            Dipakai untuk judul browser dan metadata utama
          </p>
        </Card>

        <Card title="Asset Status" variant="warning">
          <p className="text-2xl font-bold tracking-tight">
            {loading
              ? "..."
              : form.siteLogoUrl || form.siteFaviconUrl
              ? "Ready"
              : "Empty"}
          </p>
          <p className="mt-2 text-sm text-white/80">
            Logo dan favicon akan dipakai jika URL aset sudah diisi
          </p>
        </Card>

        <Card title="Site Domain" variant="danger">
          <p className="break-all text-base font-semibold">
            {loading ? "..." : form.siteDomain || "Belum diatur"}
          </p>
          <p className="mt-2 text-sm text-white/80">
            Dipakai untuk canonical URL dan identitas domain website
          </p>
        </Card>

        <Card title="Last Update" variant="default">
          <p className="text-base font-semibold">
            {loading ? "..." : formatDate(form.updatedAt)}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Waktu pembaruan pengaturan website terakhir
          </p>
        </Card>
      </div>

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card title="Pengaturan Frontend User">
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Nama Web / Brand
            </label>
            <input
              value={form.siteName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  siteName: event.target.value,
                }))
              }
              placeholder="Contoh: WebTopup"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              URL Logo Web
            </label>
            <input
              value={form.siteLogoUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  siteLogoUrl: event.target.value,
                }))
              }
              placeholder="https://..."
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              URL Favicon
            </label>
            <input
              value={form.siteFaviconUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  siteFaviconUrl: event.target.value,
                }))
              }
              placeholder="https://..."
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Domain Website
            </label>
            <input
              value={form.siteDomain}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  siteDomain: event.target.value,
                }))
              }
              placeholder="contoh: topupkamu.com atau https://topupkamu.com"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Site Title
            </label>
            <input
              value={form.siteTitle}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  siteTitle: event.target.value,
                }))
              }
              placeholder="Judul website untuk browser dan SEO dasar"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              required
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Site Description
            </label>
            <textarea
              value={form.siteDescription}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  siteDescription: event.target.value,
                }))
              }
              placeholder="Deskripsi singkat website untuk frontend dan metadata"
              className="min-h-[140px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              required
            />
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {submitting ? "Menyimpan..." : "Simpan Pengaturan Website"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
