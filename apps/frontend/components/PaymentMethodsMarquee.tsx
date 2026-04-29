import Image from "next/image";
import type { CSSProperties } from "react";

import type { StorefrontPaymentMethod } from "@/lib/siteData";

function getVisiblePaymentMethods(paymentMethods: StorefrontPaymentMethod[]) {
  const seen = new Set<string>();

  return paymentMethods.filter((paymentMethod) => {
    const logo = String(paymentMethod.logo || "").trim();

    if (!logo) {
      return false;
    }

    if (seen.has(logo)) {
      return false;
    }

    seen.add(logo);
    return true;
  });
}

export default function PaymentMethodsMarquee({
  paymentMethods,
}: {
  paymentMethods: StorefrontPaymentMethod[];
}) {
  const visiblePaymentMethods = getVisiblePaymentMethods(paymentMethods);

  if (visiblePaymentMethods.length === 0) {
    return null;
  }

  const marqueeItems = [...visiblePaymentMethods, ...visiblePaymentMethods];

  return (
    <section className="pt-8 sm:pt-10 lg:pt-12">
      <div className="overflow-hidden rounded-[28px] border border-white/8 bg-[#171922] px-5 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:px-7 sm:py-9 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-soft)]">
            Payment Channel
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-[1.9rem] font-bold tracking-tight text-white sm:text-[2.2rem]">
            Metode Pembayaran
          </h2>
          <p className="mt-3 text-sm leading-7 text-white/68 sm:text-[15px]">
            Kami mendukung berbagai metode pembayaran aktif, termasuk QRIS,
            e-wallet, virtual account, transfer bank, dan channel digital
            lainnya.
          </p>
        </div>

        <div className="relative mt-7 overflow-hidden sm:mt-9">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-[linear-gradient(90deg,#171922_0%,rgba(23,25,34,0)_100%)] sm:w-16" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-[linear-gradient(270deg,#171922_0%,rgba(23,25,34,0)_100%)] sm:w-16" />

          <div
            className="payment-methods-marquee"
            style={
              {
                "--payment-marquee-duration": `${Math.max(
                  visiblePaymentMethods.length * 3.5,
                  20
                )}s`,
              } as CSSProperties
            }
          >
            <div className="payment-methods-marquee__track">
              {marqueeItems.map((paymentMethod, index) => (
                <div
                  key={`${paymentMethod.code}-${index}`}
                  className="payment-methods-marquee__item"
                >
                  <div className="flex h-[66px] w-[132px] items-center justify-center rounded-[18px] border border-white/8 bg-white/[0.045] px-4 py-3 shadow-[0_14px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:h-[78px] sm:w-[156px] sm:px-5">
                    <Image
                      src={paymentMethod.logo || ""}
                      alt={paymentMethod.name}
                      width={124}
                      height={40}
                      sizes="(max-width: 640px) 100px, 124px"
                      className="h-auto max-h-10 w-auto max-w-[100px] object-contain sm:max-w-[124px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
