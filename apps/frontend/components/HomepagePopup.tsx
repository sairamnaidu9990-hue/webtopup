"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { PublicSiteSetting } from "@/lib/siteData";

const DISMISS_STORAGE_KEY = "kitagg-homepage-popup-dismissed";

function buildPopupSignature(siteSetting: PublicSiteSetting) {
  return JSON.stringify({
    enabled: siteSetting.homepagePopupEnabled,
    title: siteSetting.homepagePopupTitle,
    message: siteSetting.homepagePopupMessage,
    imageUrl: siteSetting.homepagePopupImageUrl,
    updatedAt: siteSetting.updatedAt || "",
  });
}

export default function HomepagePopup({
  siteSetting,
}: {
  siteSetting: PublicSiteSetting;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const hasText =
    Boolean(siteSetting.homepagePopupTitle) ||
    Boolean(siteSetting.homepagePopupMessage);
  const hasImage = Boolean(siteSetting.homepagePopupImageUrl);
  const hasContent = hasText || hasImage;
  const popupSignature = useMemo(
    () => buildPopupSignature(siteSetting),
    [siteSetting]
  );

  useEffect(() => {
    if (
      pathname !== "/" ||
      !siteSetting.homepagePopupEnabled ||
      !hasContent
    ) {
      setOpen(false);
      return;
    }

    try {
      const dismissedPopup = window.localStorage.getItem(DISMISS_STORAGE_KEY);

      if (dismissedPopup === popupSignature) {
        setOpen(false);
        return;
      }
    } catch {
      // Ignore storage errors and still show the popup.
    }

    const timeout = window.setTimeout(() => {
      setOpen(true);
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [
    hasContent,
    pathname,
    popupSignature,
    siteSetting.homepagePopupEnabled,
  ]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        window.localStorage.setItem(DISMISS_STORAGE_KEY, popupSignature);
      } catch {
        // Ignore storage errors when closing.
      }
    }

    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/10 bg-[#171a21] text-white shadow-[0_32px_90px_rgba(0,0,0,0.45)]">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Tutup popup homepage"
          className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/30 text-xl text-white transition hover:border-[#d33b3b] hover:bg-black/45"
        >
          ×
        </button>

        {hasImage ? (
          <div className="relative aspect-[16/9] w-full bg-[#111217]">
            <Image
              src={siteSetting.homepagePopupImageUrl}
              alt={siteSetting.homepagePopupTitle || siteSetting.siteName}
              fill
              sizes="(max-width: 768px) 92vw, 720px"
              className="object-cover"
              priority
            />
          </div>
        ) : null}

        {hasText ? (
          <div className="space-y-4 px-5 pb-5 pt-5 sm:px-7 sm:pb-6">
            {siteSetting.homepagePopupTitle ? (
              <div className="pr-12">
                <p className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  {siteSetting.homepagePopupTitle}
                </p>
              </div>
            ) : null}

            {siteSetting.homepagePopupMessage ? (
              <div className="space-y-3 text-sm leading-7 text-white/82 sm:text-[15px]">
                {siteSetting.homepagePopupMessage
                  .split(/\r?\n/)
                  .filter((line) => line.trim().length > 0)
                  .map((line, index) => (
                    <p key={`popup-line-${index}`}>{line}</p>
                  ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-4 border-t border-white/8 bg-white/[0.03] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <label className="flex items-center gap-3 text-sm text-white/72">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(event) => setDontShowAgain(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-transparent text-[#d33b3b] focus:ring-[#d33b3b]"
            />
            Jangan tampilkan lagi di perangkat ini
          </label>

          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
