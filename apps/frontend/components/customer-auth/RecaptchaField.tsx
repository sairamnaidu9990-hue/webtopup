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
  const containerId = useId().replace(/:/g, "");
  const [apiReady, setApiReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.grecaptcha?.render)
  );

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
      callback: (token: string) => onChangeRef.current(token),
      "expired-callback": () => onChangeRef.current(""),
      "error-callback": () => onChangeRef.current(""),
    });
  }, [apiReady, containerId]);

  useEffect(() => {
    renderWidget();
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
    <div className="space-y-2">
      <Script
        src="https://www.google.com/recaptcha/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setApiReady(true)}
      />
      <div className="rounded-[22px] border border-white/10 bg-white/5 p-3 sm:p-4">
        <div
          id={containerId}
          className="min-h-[78px] overflow-hidden rounded-2xl bg-white p-2"
        />
      </div>
      {error ? (
        <p className="text-sm text-red-200">{error}</p>
      ) : value ? (
        <p className="text-sm text-emerald-200">Verifikasi berhasil.</p>
      ) : null}
    </div>
  );
}
