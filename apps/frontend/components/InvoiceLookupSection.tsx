"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

function ReceiptSearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path d="M7 3h10a2 2 0 0 1 2 2v16l-2.5-1.5L14 21l-2.5-1.5L9 21l-2.5-1.5L4 21V5a2 2 0 0 1 2-2Z" />
      <path d="M8 8h8" />
      <path d="M8 12h5" />
      <circle cx="17.5" cy="16.5" r="2.5" />
      <path d="m20 19 1.2 1.2" />
    </svg>
  );
}

export default function InvoiceLookupSection() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedInvoice = invoiceNumber.trim().toUpperCase();

    if (!normalizedInvoice) {
      setError("Silahkan masukkan nomor invoice terlebih dahulu.");
      inputRef.current?.focus();
      return;
    }

    setError("");
    router.push(`/invoice/${encodeURIComponent(normalizedInvoice)}`);
  };

  return (
    <section className="rounded-[28px] border border-white/8 bg-[#181b22] px-4 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.42)] sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="font-[family-name:var(--font-display)] text-[1.85rem] font-bold leading-tight tracking-tight text-white sm:text-[2.5rem]">
          Cek Invoice Kamu dengan Mudah dan Cepat
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/62 sm:text-base">
          Lihat detail pembelian kamu menggunakan nomor invoice.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-7 max-w-[560px] rounded-[28px] border border-white/6 bg-[#1f2229] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.28)] sm:p-5"
      >
        <label className="block text-left text-sm font-semibold text-white">
          Cari detail pembelian kamu disini
        </label>

        <div className="mt-3 space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={invoiceNumber}
              onChange={(event) => {
                setInvoiceNumber(event.target.value);
                if (error) {
                  setError("");
                }
              }}
              placeholder="Masukkan nomor Invoice Kamu"
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#6a7280] px-4 pr-11 text-base text-white outline-none transition placeholder:text-white/55 focus:border-white/20 focus:bg-[#727b89]"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/78">
              <ReceiptSearchIcon />
            </span>
          </div>

          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-4 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(211,59,59,0.22)] transition hover:brightness-110"
          >
            Cari Invoice
          </button>
        </div>

        {error ? (
          <p className="mt-3 text-left text-sm text-[#ff9d9d]">{error}</p>
        ) : null}
      </form>
    </section>
  );
}
