"use client";

import { useEffect, useState } from "react";

type CopyInvoiceButtonProps = {
  invoiceNumber: string;
};

export default function CopyInvoiceButton({
  invoiceNumber,
}: CopyInvoiceButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopy = async () => {
    if (!invoiceNumber) {
      return;
    }

    try {
      await navigator.clipboard.writeText(invoiceNumber);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex h-10 items-center justify-center rounded-[12px] border px-4 text-[12px] font-semibold transition ${
        copied
          ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-100"
          : "border-white/8 bg-white/5 text-white hover:bg-white/8"
      }`}
    >
      {copied ? "Invoice Tersalin" : "Copy Invoice"}
    </button>
  );
}
