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
      ? "inline-flex h-7 items-center rounded-[9px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,243,247,0.92)_100%)] px-1.5 shadow-[0_8px_16px_rgba(0,0,0,0.14)] sm:h-8 sm:rounded-[10px] sm:shadow-[0_10px_18px_rgba(0,0,0,0.14)]"
      : "inline-flex h-5 items-center rounded-[6px] bg-white px-1.5 shadow-[0_5px_10px_rgba(0,0,0,0.12)] sm:h-6 sm:shadow-[0_6px_12px_rgba(0,0,0,0.12)]"
    : isKitaggBalanceMethod
      ? "inline-flex items-center rounded-[14px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,243,247,0.92)_100%)] px-2 py-2 shadow-[0_14px_28px_rgba(0,0,0,0.14)]"
      : "inline-flex items-center rounded-[10px] bg-white px-2 py-1.5 shadow-[0_8px_16px_rgba(0,0,0,0.12)]";
  const imageClassName = compact
    ? isKitaggBalanceMethod
      ? "h-4.5 w-4.5 object-contain object-center sm:h-5 sm:w-5"
      : "h-3 w-auto max-w-[42px] object-contain object-left sm:h-3.5 sm:max-w-[52px]"
    : isKitaggBalanceMethod
      ? "h-8 w-8 object-contain object-center"
      : "h-7 w-auto max-w-[92px] object-contain object-left";
  const imageShellClassName = compact
    ? "inline-flex h-4.5 w-4.5 items-center justify-center rounded-[7px] bg-white/95 sm:h-5 sm:w-5 sm:rounded-[8px]"
    : "inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/95";

  if (paymentMethod.logo) {
    return (
      <div className={wrapperClassName}>
        {isKitaggBalanceMethod ? (
          <div className={imageShellClassName}>
            <Image
              src={paymentMethod.logo}
              alt={paymentMethod.name}
              width={compact ? 18 : 32}
              height={compact ? 18 : 32}
              sizes={compact ? "(max-width: 640px) 18px, 20px" : "32px"}
              className={imageClassName}
            />
          </div>
        ) : (
          <Image
            src={paymentMethod.logo}
            alt={paymentMethod.name}
            width={compact ? 42 : 92}
            height={compact ? 12 : 28}
            sizes={compact ? "(max-width: 640px) 42px, 52px" : "92px"}
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
          ? "h-5 min-w-[42px] rounded-[6px] px-1.5 text-[8px] shadow-[0_5px_10px_rgba(0,0,0,0.12)] sm:h-6 sm:min-w-[52px] sm:text-[9px] sm:shadow-[0_6px_12px_rgba(0,0,0,0.12)]"
          : "h-10 min-w-[92px] rounded-[10px] px-3 text-[11px] shadow-[0_8px_16px_rgba(0,0,0,0.12)]"
      }`}
    >
      {paymentMethod.name}
    </div>
  );
}
