"use client";

import Image from "next/image";

import type { StorefrontPaymentMethod } from "@/lib/siteData";

export default function PaymentMethodLogo({
  paymentMethod,
  compact = false,
}: {
  paymentMethod: StorefrontPaymentMethod;
  compact?: boolean;
}) {
  const wrapperClassName = compact
    ? "inline-flex h-6 items-center rounded-[6px] bg-white px-1.5 shadow-[0_6px_12px_rgba(0,0,0,0.12)]"
    : "inline-flex items-center rounded-[10px] bg-white px-2 py-1.5 shadow-[0_8px_16px_rgba(0,0,0,0.12)]";
  const imageClassName = compact
    ? "h-3.5 w-auto max-w-[52px] object-contain object-left"
    : "h-7 w-auto max-w-[92px] object-contain object-left";

  if (paymentMethod.logo) {
    return (
      <div className={wrapperClassName}>
        <Image
          src={paymentMethod.logo}
          alt={paymentMethod.name}
          width={compact ? 52 : 92}
          height={compact ? 14 : 28}
          sizes={compact ? "52px" : "92px"}
          className={imageClassName}
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center bg-white font-semibold text-[#1f2024] ${
        compact
          ? "h-6 min-w-[52px] rounded-[6px] px-1.5 text-[9px] shadow-[0_6px_12px_rgba(0,0,0,0.12)]"
          : "h-10 min-w-[92px] rounded-[10px] px-3 text-[11px] shadow-[0_8px_16px_rgba(0,0,0,0.12)]"
      }`}
    >
      {paymentMethod.name}
    </div>
  );
}
