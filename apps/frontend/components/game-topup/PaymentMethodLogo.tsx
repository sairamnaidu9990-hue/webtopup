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
  const isKitaggBalanceMethod = paymentMethod.code === "KITAGG_BALANCE";
  const wrapperClassName = compact
    ? isKitaggBalanceMethod
      ? "inline-flex h-8 items-center rounded-[10px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,243,247,0.92)_100%)] px-1.5 shadow-[0_10px_18px_rgba(0,0,0,0.14)]"
      : "inline-flex h-6 items-center rounded-[6px] bg-white px-1.5 shadow-[0_6px_12px_rgba(0,0,0,0.12)]"
    : isKitaggBalanceMethod
      ? "inline-flex items-center rounded-[14px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,243,247,0.92)_100%)] px-2 py-2 shadow-[0_14px_28px_rgba(0,0,0,0.14)]"
      : "inline-flex items-center rounded-[10px] bg-white px-2 py-1.5 shadow-[0_8px_16px_rgba(0,0,0,0.12)]";
  const imageClassName = compact
    ? isKitaggBalanceMethod
      ? "h-5 w-5 object-contain object-center"
      : "h-3.5 w-auto max-w-[52px] object-contain object-left"
    : isKitaggBalanceMethod
      ? "h-8 w-8 object-contain object-center"
      : "h-7 w-auto max-w-[92px] object-contain object-left";
  const imageShellClassName = compact
    ? "inline-flex h-5 w-5 items-center justify-center rounded-[8px] bg-white/95"
    : "inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/95";

  if (paymentMethod.logo) {
    return (
      <div className={wrapperClassName}>
        {isKitaggBalanceMethod ? (
          <div className={imageShellClassName}>
            <Image
              src={paymentMethod.logo}
              alt={paymentMethod.name}
              width={compact ? 20 : 32}
              height={compact ? 20 : 32}
              sizes={compact ? "20px" : "32px"}
              className={imageClassName}
            />
          </div>
        ) : (
          <Image
            src={paymentMethod.logo}
            alt={paymentMethod.name}
            width={compact ? 52 : 92}
            height={compact ? 14 : 28}
            sizes={compact ? "52px" : "92px"}
            className={imageClassName}
          />
        )}
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
