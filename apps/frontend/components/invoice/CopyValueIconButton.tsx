"use client";

import { useEffect, useState } from "react";

type CopyValueIconButtonProps = {
  value: string;
  label: string;
};

export default function CopyValueIconButton({
  value,
  label,
}: CopyValueIconButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 1600);

    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopy = async () => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      title={copied ? "Tersalin" : label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-[10px] border transition ${
        copied
          ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-100"
          : "border-white/8 bg-white/5 text-white/78 hover:bg-white/8 hover:text-white"
      }`}
    >
      {copied ? (
        <span className="text-[12px] font-bold">✓</span>
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="10" height="10" rx="2" />
          <path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}
