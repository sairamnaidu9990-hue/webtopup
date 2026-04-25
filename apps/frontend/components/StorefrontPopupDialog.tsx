"use client";

import Image from "next/image";
import { useEffect } from "react";

export default function StorefrontPopupDialog({
  open,
  title,
  message,
  imageUrl,
  imageAlt,
  dontShowAgain,
  onDontShowAgainChange,
  onClose,
}: {
  open: boolean;
  title?: string;
  message?: string;
  imageUrl?: string;
  imageAlt: string;
  dontShowAgain: boolean;
  onDontShowAgainChange: (checked: boolean) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const hasTitle = Boolean(title);
  const hasMessage = Boolean(message);
  const hasImage = Boolean(imageUrl);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/10 bg-[#171a21] text-white shadow-[0_32px_90px_rgba(0,0,0,0.45)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup popup"
          className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/30 text-xl text-white transition hover:border-[#d33b3b] hover:bg-black/45"
        >
          ×
        </button>

        {hasImage ? (
          <div className="relative aspect-[16/9] w-full bg-[#111217]">
            <Image
              src={imageUrl || ""}
              alt={imageAlt}
              fill
              sizes="(max-width: 768px) 92vw, 720px"
              className="object-cover"
              priority
            />
          </div>
        ) : null}

        {hasTitle || hasMessage ? (
          <div className="space-y-4 px-5 pb-5 pt-5 sm:px-7 sm:pb-6">
            {hasTitle ? (
              <div className="pr-12">
                <p className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  {title}
                </p>
              </div>
            ) : null}

            {hasMessage ? (
              <div className="space-y-3 text-sm leading-7 text-white/82 sm:text-[15px]">
                {String(message)
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
              onChange={(event) => onDontShowAgainChange(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-transparent text-[#d33b3b] focus:ring-[#d33b3b]"
            />
            Jangan tampilkan lagi di perangkat ini
          </label>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
