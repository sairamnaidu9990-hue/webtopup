"use client";

import { useCallback, useEffect, useState } from "react";
import { getResponseMessage, parseJsonSafely } from "@/app/lib/http";
import Card from "../../components/ui/Card";
import SectionTitle from "../../components/ui/SectionTitle";
import type { SiteSetting } from "@/app/types/SiteSetting";
import SettingsSubsection from "./SettingsSubsection";
import {
  MAX_BANNER_COUNT,
  clampNumber,
  defaultSiteSettingForm,
  normalizeSiteSetting,
  syncBannerLength,
} from "./siteSettingsForm";

export default function WebsiteSettingsPageClient() {
  const [form, setForm] = useState<SiteSetting>(defaultSiteSettingForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/site-settings", {
        cache: "no-store",
      });
      const payload = await parseJsonSafely<{ message?: string; siteSetting?: SiteSetting }>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal mengambil pengaturan website"));
      }

      setForm(normalizeSiteSetting(payload?.siteSetting));
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Gagal mengambil pengaturan website"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

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
          kitaggBalanceLogoUrl: form.kitaggBalanceLogoUrl,
          siteDomain: form.siteDomain,
          googleSiteVerification: form.googleSiteVerification,
          siteTitle: form.siteTitle,
          siteDescription: form.siteDescription,
          gameCategories: form.gameCategories,
          categoryDescriptions: form.categoryDescriptions,
          gameFaqs: form.gameFaqs,
          reviewCommentsVisible: form.reviewCommentsVisible,
          bannerCount: form.bannerCount,
          bannerAutoSlideSeconds: form.bannerAutoSlideSeconds,
          homepagePopupEnabled: form.homepagePopupEnabled,
          homepagePopupTitle: form.homepagePopupTitle,
          homepagePopupMessage: form.homepagePopupMessage,
          homepagePopupImageUrl: form.homepagePopupImageUrl,
          floatingContactEnabled: form.floatingContactEnabled,
          floatingContactLabel: form.floatingContactLabel,
          floatingContactUrl: form.floatingContactUrl,
          maintenanceModeEnabled: form.maintenanceModeEnabled,
          maintenanceTitle: form.maintenanceTitle,
          maintenanceMessage: form.maintenanceMessage,
          legalityContent: form.legalityContent,
          privacyPolicyContent: form.privacyPolicyContent,
          termsConditionsContent: form.termsConditionsContent,
          banners: form.banners,
          footerDescription: form.footerDescription,
          footerBottomText: form.footerBottomText,
          footerSocialLinks: form.footerSocialLinks,
          footerLinkColumns: form.footerLinkColumns,
        }),
      });
      const payload = await parseJsonSafely<{ message?: string; siteSetting?: SiteSetting }>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal memperbarui pengaturan website"));
      }

      setSuccess(getResponseMessage(payload, "Pengaturan website berhasil diperbarui"));
      setForm(normalizeSiteSetting(payload?.siteSetting));
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
        subtitle="Atur identitas website, banner homepage, dan footer storefront yang dipakai langsung oleh frontend user."
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

      {loading ? (
        <Card title="Pengaturan Frontend User">
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
            Memuat pengaturan website...
          </div>
        </Card>
      ) : null}

      {!loading ? (
      <Card title="Pengaturan Frontend User">
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
          <SettingsSubsection
            title="Brand"
            description="Atur identitas utama website seperti nama brand, logo, favicon, domain, dan metadata storefront."
          >
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

            <div className="space-y-2">
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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                URL Logo Saldo KITAGG
              </label>
              <input
                value={form.kitaggBalanceLogoUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    kitaggBalanceLogoUrl: event.target.value,
                  }))
                }
                placeholder="https://... atau kosongkan untuk pakai logo web"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
              <p className="text-xs leading-6 text-gray-500">
                Logo ini dipakai untuk metode pembayaran Saldo KITAGG dan kartu
                saldo di dashboard user.
              </p>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Google Search Console Verification
              </label>
              <input
                value={form.googleSiteVerification}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    googleSiteVerification: event.target.value,
                  }))
                }
                placeholder="Paste token content dari meta google-site-verification"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
              <p className="text-xs leading-6 text-gray-500">
                Isi dengan token dari Google Search Console. Contoh: jika meta
                tag dari Google berisi{" "}
                <span className="font-mono">content=&quot;abc123&quot;</span>,
                cukup masukkan <span className="font-mono">abc123</span>.
              </p>
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
          </SettingsSubsection>

          <SettingsSubsection
            title="Banner"
            description="Atur jumlah slide, kecepatan autoplay, dan isi setiap banner yang tampil di bawah header storefront."
          >
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
                    defaultSiteSettingForm.bannerCount
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
                      defaultSiteSettingForm.bannerAutoSlideSeconds
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
              {form.banners.map((banner, index) => (
                <div
                  key={`banner-${index}`}
                  className="rounded-2xl border border-gray-200 bg-white/80 p-4"
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
                      <p className="text-xs leading-6 text-gray-500">
                        Rekomendasi ukuran homepage banner: 1600 x 800 px atau
                        rasio sekitar 2:1 agar desktop tetap penuh dan versi
                        mobile tetap utuh.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SettingsSubsection>

          <SettingsSubsection
            title="Homepage Popup"
            description="Tampilkan popup promosi atau pengumuman saat user pertama kali membuka homepage. Bisa dipakai untuk teks saja, banner saja, atau kombinasi keduanya."
          >
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Aktifkan Popup Homepage
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.homepagePopupEnabled}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      homepagePopupEnabled: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm text-gray-700">
                  Popup hanya tampil di homepage storefront
                </span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Judul Popup
              </label>
              <input
                value={form.homepagePopupTitle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    homepagePopupTitle: event.target.value,
                  }))
                }
                placeholder="Contoh: Promo Weekend Spesial"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
              <p className="text-xs leading-6 text-gray-500">
                Bisa dikosongkan jika kamu hanya ingin menampilkan banner saja.
              </p>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Isi Popup / Teks Pengumuman
              </label>
              <textarea
                value={form.homepagePopupMessage}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    homepagePopupMessage: event.target.value,
                  }))
                }
                placeholder="Tulis pengumuman, promo, atau informasi penting yang ingin langsung dilihat user."
                className="min-h-[140px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
              <p className="text-xs leading-6 text-gray-500">
                Bisa dikosongkan jika popup hanya ingin berisi banner visual.
                Untuk membuat teks tertentu bisa diklik, gunakan format
                {" "}
                <span className="font-mono text-[11px] text-gray-700">
                  [Klik Disini](https://instagram.com/akunmu)
                </span>
                {" "}
                lalu lanjutkan kalimat biasa setelahnya.
              </p>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                URL Banner Popup
              </label>
              <input
                value={form.homepagePopupImageUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    homepagePopupImageUrl: event.target.value,
                  }))
                }
                placeholder="https://..."
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
              <p className="text-xs leading-6 text-gray-500">
                Rekomendasi ukuran banner popup: 1600 x 900 px atau landscape lebar agar tetap rapi di desktop dan mobile.
              </p>
            </div>
          </SettingsSubsection>

          <SettingsSubsection
            title="Sticky Contact Button"
            description="Tampilkan tombol sticky di kanan bawah storefront. Saat user klik, mereka akan langsung diarahkan ke link yang kamu tentukan."
          >
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Aktifkan Tombol Sticky
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.floatingContactEnabled}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      floatingContactEnabled: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm text-gray-700">
                  Tampilkan tombol sticky chat/contact di frontend
                </span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Label Tombol
              </label>
              <input
                value={form.floatingContactLabel}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    floatingContactLabel: event.target.value,
                  }))
                }
                placeholder="Contoh: Chat CS"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
              <p className="text-xs leading-6 text-gray-500">
                Gunakan label singkat agar tetap rapi di desktop dan mobile.
              </p>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Link Redirect
              </label>
              <input
                value={form.floatingContactUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    floatingContactUrl: event.target.value,
                  }))
                }
                placeholder="Contoh: https://wa.me/6281234567890"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
              <p className="text-xs leading-6 text-gray-500">
                Bisa diisi link WhatsApp, Telegram, live chat, atau halaman
                internal seperti /contact.
              </p>
            </div>
          </SettingsSubsection>

          <SettingsSubsection
            title="Maintenance Mode"
            description="Nonaktifkan sementara semua halaman storefront user dan tampilkan halaman maintenance khusus saat website sedang diperbaiki."
          >
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Aktifkan Maintenance Frontend
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.maintenanceModeEnabled}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      maintenanceModeEnabled: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm text-gray-700">
                  Saat aktif, seluruh halaman frontend user akan menampilkan
                  halaman maintenance
                </span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Judul Maintenance
              </label>
              <input
                value={form.maintenanceTitle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    maintenanceTitle: event.target.value,
                  }))
                }
                placeholder="Contoh: Website Sedang Maintenance"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Pesan Maintenance
              </label>
              <textarea
                value={form.maintenanceMessage}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    maintenanceMessage: event.target.value,
                  }))
                }
                placeholder="Tulis pesan yang akan dilihat user saat storefront sedang maintenance"
                className="min-h-[120px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
              <p className="text-xs leading-6 text-gray-500">
                Cocok dipakai saat deploy besar, migrasi data, atau maintenance
                gateway agar user tidak masuk ke flow order yang belum stabil.
              </p>
            </div>
          </SettingsSubsection>

          <SettingsSubsection
            title="Category"
            description="Kelola daftar kategori katalog yang dipakai untuk game di admin dan filter All Games di storefront user."
          >
            <div className="space-y-3 lg:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Daftar Kategori Game
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      gameCategories: [...current.gameCategories, ""],
                      categoryDescriptions: [
                        ...current.categoryDescriptions,
                        { category: "", description: "" },
                      ],
                    }))
                  }
                  className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-white"
                >
                  Tambah Category
                </button>
              </div>

              <div className="space-y-3">
                {form.gameCategories.map((category, index) => (
                  <div
                    key={`game-category-${index}`}
                    className="flex flex-col gap-3 sm:flex-row"
                  >
                    <input
                      value={category}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          gameCategories: current.gameCategories.map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item
                          ),
                          categoryDescriptions: current.categoryDescriptions.map(
                            (item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    category: event.target.value,
                                  }
                                : item
                          ),
                        }))
                      }
                      placeholder={`Category ${index + 1}`}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          gameCategories:
                            current.gameCategories.length <= 1
                              ? current.gameCategories
                              : current.gameCategories.filter(
                                  (_, itemIndex) => itemIndex !== index
                                ),
                          categoryDescriptions:
                            current.categoryDescriptions.length <= 1
                              ? current.categoryDescriptions
                              : current.categoryDescriptions.filter(
                                  (_, itemIndex) => itemIndex !== index
                                ),
                        }))
                      }
                      className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={form.gameCategories.length <= 1}
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-4 border-t border-gray-200 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Deskripsi Dinamis Per Kategori
                  </label>
                  <p className="mt-1 text-xs leading-6 text-gray-500">
                    Deskripsi ini akan tampil otomatis di halaman game sesuai
                    kategorinya. Kamu bisa pakai token{" "}
                    <span className="font-mono text-[11px] text-gray-700">
                      {"{gameName}"}
                    </span>
                    ,{" "}
                    <span className="font-mono text-[11px] text-gray-700">
                      {"{provider}"}
                    </span>
                    ,{" "}
                    <span className="font-mono text-[11px] text-gray-700">
                      {"{category}"}
                    </span>
                    , dan{" "}
                    <span className="font-mono text-[11px] text-gray-700">
                      {"{siteName}"}
                    </span>
                    .
                  </p>
                </div>

                <div className="space-y-4">
                  {form.categoryDescriptions.map((item, index) => (
                    <div
                      key={`category-description-${index}`}
                      className="rounded-2xl border border-gray-200 bg-white/80 p-4"
                    >
                      <p className="text-sm font-semibold text-gray-800">
                        Deskripsi {item.category || `Category ${index + 1}`}
                      </p>
                      <textarea
                        value={item.description}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            categoryDescriptions: current.categoryDescriptions.map(
                              (currentItem, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...currentItem,
                                      description: event.target.value,
                                    }
                                  : currentItem
                            ),
                          }))
                        }
                        placeholder={`Contoh: Top up {gameName} murah, cepat, dan aman di {siteName}.`}
                        className="mt-3 min-h-[160px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      FAQ Halaman Game
                    </label>
                    <p className="mt-1 text-xs leading-6 text-gray-500">
                      FAQ ini tampil di semua halaman game, tepat di bawah
                      deskripsi. Kamu bisa pakai token{" "}
                      <span className="font-mono text-[11px] text-gray-700">
                        {"{gameName}"}
                      </span>
                      ,{" "}
                      <span className="font-mono text-[11px] text-gray-700">
                        {"{provider}"}
                      </span>
                      ,{" "}
                      <span className="font-mono text-[11px] text-gray-700">
                        {"{category}"}
                      </span>
                      , dan{" "}
                      <span className="font-mono text-[11px] text-gray-700">
                        {"{siteName}"}
                      </span>
                      .
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        gameFaqs: [
                          ...current.gameFaqs,
                          { question: "", answer: "" },
                        ],
                      }))
                    }
                    className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-white"
                  >
                    Tambah FAQ
                  </button>
                </div>

                {form.gameFaqs.length > 0 ? (
                  <div className="space-y-4">
                    {form.gameFaqs.map((item, index) => (
                      <div
                        key={`game-faq-${index}`}
                        className="rounded-2xl border border-gray-200 bg-white/80 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-800">
                            FAQ {index + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                gameFaqs: current.gameFaqs.filter(
                                  (_, itemIndex) => itemIndex !== index
                                ),
                              }))
                            }
                            className="text-sm font-semibold text-red-600 transition hover:text-red-700"
                          >
                            Hapus
                          </button>
                        </div>

                        <div className="mt-4 space-y-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Pertanyaan
                            </label>
                            <input
                              value={item.question}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  gameFaqs: current.gameFaqs.map(
                                    (currentItem, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...currentItem,
                                            question: event.target.value,
                                          }
                                        : currentItem
                                  ),
                                }))
                              }
                              placeholder="Contoh: Bagaimana cara top up {gameName} di {siteName}?"
                              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Jawaban
                            </label>
                            <textarea
                              value={item.answer}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  gameFaqs: current.gameFaqs.map(
                                    (currentItem, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...currentItem,
                                            answer: event.target.value,
                                          }
                                        : currentItem
                                  ),
                                }))
                              }
                              placeholder="Tulis jawaban FAQ yang akan tampil di semua halaman game."
                              className="min-h-[120px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 px-4 py-4 text-sm text-gray-500">
                    Belum ada FAQ global untuk halaman game.
                  </div>
                )}
              </div>

              <div className="space-y-2 border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Tampilkan Komentar Review
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.reviewCommentsVisible}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        reviewCommentsVisible: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="text-sm text-gray-700">
                    Saat dimatikan, storefront hanya menampilkan rating dan
                    jumlah ulasan tanpa isi komentar pelanggan.
                  </span>
                </label>
              </div>
            </div>
          </SettingsSubsection>

          <SettingsSubsection
            title="Halaman Informasi"
            description="Isi konten untuk halaman Legalitas, Kebijakan Pribadi, dan Syarat & Ketentuan yang akan tampil di storefront user."
          >
            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Legalitas
              </label>
              <textarea
                value={form.legalityContent}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    legalityContent: event.target.value,
                  }))
                }
                placeholder="Tulis isi halaman legalitas di sini..."
                className="min-h-[180px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
              <p className="text-xs leading-6 text-gray-500">
                Bisa diisi profil badan usaha, alamat, kontak resmi, izin, atau
                informasi legal lain. Enter baru akan tampil sebagai paragraf/baris baru.
              </p>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Kebijakan Pribadi
              </label>
              <textarea
                value={form.privacyPolicyContent}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    privacyPolicyContent: event.target.value,
                  }))
                }
                placeholder="Tulis isi halaman kebijakan pribadi di sini..."
                className="min-h-[200px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Syarat & Ketentuan
              </label>
              <textarea
                value={form.termsConditionsContent}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    termsConditionsContent: event.target.value,
                  }))
                }
                placeholder="Tulis isi halaman syarat & ketentuan di sini..."
                className="min-h-[220px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
            </div>
          </SettingsSubsection>

          <SettingsSubsection
            title="Footer"
            description="Atur area footer storefront, mulai dari deskripsi brand, social links, sampai kolom link seperti Partnership, Site Map, dan Support."
          >
            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Deskripsi Footer
              </label>
              <textarea
                value={form.footerDescription}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    footerDescription: event.target.value,
                  }))
                }
                placeholder="Deskripsi singkat di area footer storefront"
                className="min-h-[120px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Copyright / Footer Bottom Text
              </label>
              <input
                value={form.footerBottomText}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    footerBottomText: event.target.value,
                  }))
                }
                placeholder="Contoh: © 2026 WebTopup. All rights reserved."
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Social Links Footer
                </label>
                <p className="mt-1 text-xs leading-6 text-gray-500">
                  Tambah, hapus, dan atur link media sosial atau contact link
                  yang tampil di footer.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    footerSocialLinks: [
                      ...current.footerSocialLinks,
                      { label: "", url: "" },
                    ],
                  }))
                }
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                Tambah Social Link
              </button>
            </div>

            <div className="space-y-3">
              {form.footerSocialLinks.map((link, index) => (
                <div
                  key={`footer-social-${index}`}
                  className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-800">
                      Social Link {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          footerSocialLinks: current.footerSocialLinks.filter(
                            (_, currentIndex) => currentIndex !== index
                          ),
                        }))
                      }
                      className="text-sm font-semibold text-red-600 transition hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Label
                      </label>
                      <input
                        value={link.label}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            footerSocialLinks:
                              current.footerSocialLinks.map(
                                (currentLink, currentIndex) =>
                                  currentIndex === index
                                    ? {
                                        ...currentLink,
                                        label: event.target.value,
                                      }
                                    : currentLink
                              ),
                          }))
                        }
                        placeholder="Contoh: Instagram"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        URL
                      </label>
                      <input
                        value={link.url}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            footerSocialLinks:
                              current.footerSocialLinks.map(
                                (currentLink, currentIndex) =>
                                  currentIndex === index
                                    ? {
                                        ...currentLink,
                                        url: event.target.value,
                                      }
                                    : currentLink
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

          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Footer Link Columns
                </label>
                <p className="mt-1 text-xs leading-6 text-gray-500">
                  Gunakan untuk area seperti Partnership, Site Map, Support,
                  atau kolom link footer lainnya.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    footerLinkColumns: [
                      ...current.footerLinkColumns,
                      {
                        title: "",
                        links: [{ label: "", url: "" }],
                      },
                    ],
                  }))
                }
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                Tambah Kolom Footer
              </button>
            </div>

            <div className="space-y-4">
              {form.footerLinkColumns.map((column, columnIndex) => (
                <div
                  key={`footer-column-${columnIndex}`}
                  className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-800">
                      Kolom Footer {columnIndex + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          footerLinkColumns: current.footerLinkColumns.filter(
                            (_, currentIndex) => currentIndex !== columnIndex
                          ),
                        }))
                      }
                      className="text-sm font-semibold text-red-600 transition hover:text-red-700"
                    >
                      Hapus Kolom
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Judul Kolom
                    </label>
                    <input
                      value={column.title}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          footerLinkColumns: current.footerLinkColumns.map(
                            (currentColumn, currentIndex) =>
                              currentIndex === columnIndex
                                ? {
                                    ...currentColumn,
                                    title: event.target.value,
                                  }
                                : currentColumn
                          ),
                        }))
                      }
                      placeholder="Contoh: Support"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                    />
                  </div>

                  <div className="mt-4 space-y-3">
                    {column.links.map((link, linkIndex) => (
                      <div
                        key={`footer-column-${columnIndex}-link-${linkIndex}`}
                        className="rounded-2xl border border-gray-200 bg-white/80 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-800">
                            Link {linkIndex + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                footerLinkColumns:
                                  current.footerLinkColumns.map(
                                    (currentColumn, currentIndex) =>
                                      currentIndex === columnIndex
                                        ? {
                                            ...currentColumn,
                                            links: currentColumn.links.filter(
                                              (_, currentLinkIndex) =>
                                                currentLinkIndex !== linkIndex
                                            ),
                                          }
                                        : currentColumn
                                  ),
                              }))
                            }
                            className="text-sm font-semibold text-red-600 transition hover:text-red-700"
                          >
                            Hapus Link
                          </button>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Label Link
                            </label>
                            <input
                              value={link.label}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  footerLinkColumns:
                                    current.footerLinkColumns.map(
                                      (currentColumn, currentIndex) =>
                                        currentIndex === columnIndex
                                          ? {
                                              ...currentColumn,
                                              links: currentColumn.links.map(
                                                (currentLink, currentLinkIndex) =>
                                                  currentLinkIndex === linkIndex
                                                    ? {
                                                        ...currentLink,
                                                        label:
                                                          event.target.value,
                                                      }
                                                    : currentLink
                                              ),
                                            }
                                          : currentColumn
                                    ),
                                }))
                              }
                              placeholder="Contoh: Contact Us"
                              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              URL Link
                            </label>
                            <input
                              value={link.url}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  footerLinkColumns:
                                    current.footerLinkColumns.map(
                                      (currentColumn, currentIndex) =>
                                        currentIndex === columnIndex
                                          ? {
                                              ...currentColumn,
                                              links: currentColumn.links.map(
                                                (currentLink, currentLinkIndex) =>
                                                  currentLinkIndex === linkIndex
                                                    ? {
                                                        ...currentLink,
                                                        url: event.target.value,
                                                      }
                                                    : currentLink
                                              ),
                                            }
                                          : currentColumn
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

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          footerLinkColumns: current.footerLinkColumns.map(
                            (currentColumn, currentIndex) =>
                              currentIndex === columnIndex
                                ? {
                                    ...currentColumn,
                                    links: [
                                      ...currentColumn.links,
                                      { label: "", url: "" },
                                    ],
                                  }
                                : currentColumn
                          ),
                        }))
                      }
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-white"
                    >
                      Tambah Link di Kolom Ini
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </SettingsSubsection>

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
      ) : null}
    </div>
  );
}
