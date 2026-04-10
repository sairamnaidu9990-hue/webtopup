"use client";

import { useEffect, useState } from "react";
import SectionTitle from "../../components/ui/SectionTitle";
import Card from "../../components/ui/Card";
import type { SiteSetting } from "@/app/types/SiteSetting";

const DEFAULT_BANNER_COUNT = 3;
const MAX_BANNER_COUNT = 10;
const DEFAULT_AUTO_SLIDE_SECONDS = 5;

const defaultForm: SiteSetting = {
  siteName: "WebTopup",
  siteLogoUrl: "",
  siteFaviconUrl: "",
  siteDomain: "",
  siteTitle: "WebTopup - Top Up Game Realtime",
  siteDescription:
    "Website top up game realtime dengan katalog yang dikelola langsung dari panel admin.",
  bannerCount: DEFAULT_BANNER_COUNT,
  bannerAutoSlideSeconds: DEFAULT_AUTO_SLIDE_SECONDS,
  banners: Array.from({ length: DEFAULT_BANNER_COUNT }, () => ({
    title: "",
    imageUrl: "",
  })),
};

function clampNumber(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, min), max);
}

function syncBannerLength(
  banners: SiteSetting["banners"],
  bannerCount: number
): SiteSetting["banners"] {
  return Array.from({ length: bannerCount }, (_, index) => ({
    title: banners[index]?.title || "",
    imageUrl: banners[index]?.imageUrl || "",
  }));
}

function normalizeSiteSetting(
  value?: Partial<SiteSetting> | null
): SiteSetting {
  const bannerCount = clampNumber(
    Number(value?.bannerCount ?? defaultForm.bannerCount),
    0,
    MAX_BANNER_COUNT,
    defaultForm.bannerCount
  );

  return {
    ...defaultForm,
    ...value,
    bannerCount,
    bannerAutoSlideSeconds: clampNumber(
      Number(
        value?.bannerAutoSlideSeconds ?? defaultForm.bannerAutoSlideSeconds
      ),
      1,
      30,
      defaultForm.bannerAutoSlideSeconds
    ),
    banners: syncBannerLength(
      Array.isArray(value?.banners) ? value.banners : defaultForm.banners,
      bannerCount
    ),
  };
}

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

      setForm(normalizeSiteSetting(payload.siteSetting));
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
          bannerCount: form.bannerCount,
          bannerAutoSlideSeconds: form.bannerAutoSlideSeconds,
          banners: form.banners,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.message || "Gagal memperbarui pengaturan website"
        );
      }

      setSuccess(payload.message || "Pengaturan website berhasil diperbarui");
      setForm(normalizeSiteSetting(payload.siteSetting));
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
        subtitle="Atur Website."
      />
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

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Jumlah Banner
            </label>
            <input
              type="number"
              min={0}
              max={MAX_BANNER_COUNT}
              value={form.bannerCount}
              onChange={(event) => {
                const nextBannerCount = clampNumber(
                  Number(event.target.value),
                  0,
                  MAX_BANNER_COUNT,
                  defaultForm.bannerCount
                );

                setForm((current) => ({
                  ...current,
                  bannerCount: nextBannerCount,
                  banners: syncBannerLength(current.banners, nextBannerCount),
                }));
              }}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            />
            <p className="text-xs leading-6 text-gray-500">
              Atur berapa slide banner yang ingin ditampilkan di homepage user.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Auto Slide Banner (detik)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={form.bannerAutoSlideSeconds}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  bannerAutoSlideSeconds: clampNumber(
                    Number(event.target.value),
                    1,
                    30,
                    defaultForm.bannerAutoSlideSeconds
                  ),
                }))
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
            />
            <p className="text-xs leading-6 text-gray-500">
              Interval perpindahan otomatis antar banner di frontend user.
            </p>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Banner Homepage
              </label>
              <p className="mt-1 text-xs leading-6 text-gray-500">
                Isi judul dan URL gambar untuk setiap banner yang akan diputar
                otomatis di bawah header website.
              </p>
            </div>

            <div className="space-y-4">
              {form.banners.map((banner, index) => (
                <div
                  key={`banner-${index}`}
                  className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4"
                >
                  <p className="text-sm font-semibold text-gray-800">
                    Banner {index + 1}
                  </p>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Judul Banner
                      </label>
                      <input
                        value={banner.title}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            banners: current.banners.map(
                              (currentBanner, bannerIndex) =>
                                bannerIndex === index
                                  ? {
                                      ...currentBanner,
                                      title: event.target.value,
                                    }
                                  : currentBanner
                            ),
                          }))
                        }
                        placeholder="Contoh: Promo Top Up MLBB Hari Ini"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Banner URL
                      </label>
                      <input
                        value={banner.imageUrl}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            banners: current.banners.map(
                              (currentBanner, bannerIndex) =>
                                bannerIndex === index
                                  ? {
                                      ...currentBanner,
                                      imageUrl: event.target.value,
                                    }
                                  : currentBanner
                            ),
                          }))
                        }
                        placeholder="https://..."
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
