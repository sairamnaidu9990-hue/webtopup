"use client";

import Script from "next/script";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() || "";

type RecaptchaFieldProps = {
  value: string;
  onChange: (token: string) => void;
  error?: string;
  resetNonce?: number;
};

export function isRecaptchaEnabled() {
  return Boolean(RECAPTCHA_SITE_KEY);
}

export default function RecaptchaField({
  value,
  onChange,
  error = "",
  resetNonce = 0,
}: RecaptchaFieldProps) {
  const widgetIdRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  const retryTimerRef = useRef<number | null>(null);
  const containerId = useId().replace(/:/g, "");
  const [apiReady, setApiReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.grecaptcha?.render)
  );
  const [widgetMounted, setWidgetMounted] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const renderWidget = useCallback(() => {
    if (
      !RECAPTCHA_SITE_KEY ||
      !apiReady ||
      typeof window === "undefined" ||
      !window.grecaptcha?.render ||
      widgetIdRef.current !== null
    ) {
      return;
    }

    const container = document.getElementById(containerId);

    if (!container) {
      return;
    }

    widgetIdRef.current = window.grecaptcha.render(container, {
      sitekey: RECAPTCHA_SITE_KEY,
      callback: (token: string) => {
        setWidgetMounted(true);
        onChangeRef.current(token);
      },
      "expired-callback": () => onChangeRef.current(""),
      "error-callback": () => onChangeRef.current(""),
    });
    setWidgetMounted(true);
  }, [apiReady, containerId]);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || widgetIdRef.current !== null) {
      return undefined;
    }

    let cancelled = false;

    const attemptRender = () => {
      if (cancelled) {
        return;
      }

      renderWidget();

      if (widgetIdRef.current === null) {
        retryTimerRef.current = window.setTimeout(attemptRender, 250);
      }
    };

    attemptRender();

    return () => {
      cancelled = true;
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [renderWidget]);

  useEffect(() => {
    if (
      !apiReady ||
      widgetIdRef.current === null ||
      typeof window === "undefined" ||
      !window.grecaptcha?.reset
    ) {
      return;
    }

    window.grecaptcha.reset(widgetIdRef.current);
    onChangeRef.current("");
  }, [apiReady, resetNonce]);

  if (!RECAPTCHA_SITE_KEY) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Script
        src="https://www.google.com/recaptcha/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setApiReady(true)}
      />
      <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.03)_100%)] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.16)] sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              Verifikasi Keamanan
            </p>
            <p className="text-xs text-white/55">
              Selesaikan reCAPTCHA sebelum melanjutkan ke akunmu.
            </p>
          </div>
          <span
            className={`inline-flex min-w-[86px] items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
              value
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : "border-white/10 bg-white/5 text-white/50"
            }`}
          >
            {value ? "Terverifikasi" : "Wajib"}
          </span>
        </div>

        <div className="flex justify-center">
          <div className="inline-flex w-full max-w-[334px] items-center justify-center overflow-hidden rounded-[20px] border border-black/8 bg-white/98 p-2 shadow-[0_16px_30px_rgba(0,0,0,0.12)]">
            <div className="w-full overflow-hidden">
              <div
                id={containerId}
                className="mx-auto min-h-[78px] w-full max-w-[304px] overflow-hidden"
              />
              {!widgetMounted ? (
                <div className="mt-2 text-center text-[11px] text-black/50">
                  Menyiapkan reCAPTCHA...
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {error ? (
        <p className="text-sm text-red-200">{error}</p>
      ) : value ? (
        <p className="text-sm text-emerald-200">Verifikasi berhasil.</p>
      ) : null}
    </div>
  );
}
