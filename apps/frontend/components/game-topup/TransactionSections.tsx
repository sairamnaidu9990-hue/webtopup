"use client";

import Image from "next/image";
import type { Dispatch, SetStateAction } from "react";

import {
  type PaymentMethodGroup,
  type VariantGroup,
  formatCurrency,
  getPaymentTotal,
  renderInputControl,
} from "@/components/game-topup/helpers";
import PaymentMethodLogo from "@/components/game-topup/PaymentMethodLogo";
import type {
  StorefrontGameInput,
  StorefrontPaymentMethod,
  StorefrontVariant,
} from "@/lib/siteData";

export function AccountStepSection({
  resolvedInputs,
  accountValues,
  onAccountChange,
}: {
  resolvedInputs: StorefrontGameInput[];
  accountValues: Record<string, string>;
  onAccountChange: (key: string, nextValue: string) => void;
}) {
  if (resolvedInputs.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-white/10 bg-[#242429] px-4 py-4 text-[13px] leading-6 text-white/58">
        Input akun untuk game ini belum tersedia Jalankan{" "}
        <span className="font-semibold text-white/82">Sync Details</span> dari
        provider agar field input asli masuk ke game ini.
      </div>
    );
  }

  return (
    <div className={`grid gap-3 ${resolvedInputs.length > 1 ? "grid-cols-2" : ""}`}>
      {resolvedInputs.map((gameInput) => {
        const key = gameInput.name || gameInput.title;

        return (
          <label key={key} className="block">
            <span className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/88">
              {gameInput.title || gameInput.name}
              <span className="text-[11px] text-white/45">ⓘ</span>
            </span>
            {renderInputControl(gameInput, accountValues[key] || "", (nextValue) =>
              onAccountChange(key, nextValue)
            )}
          </label>
        );
      })}
    </div>
  );
}

export function VariantStepSection({
  variantGroups,
  selectedVariant,
  onVariantSelect,
}: {
  variantGroups: VariantGroup[];
  selectedVariant: StorefrontVariant | null;
  onVariantSelect: (variantId: string) => void;
}) {
  if (variantGroups.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-white/10 bg-[#242429] px-4 py-4 text-[13px] text-white/52">
        Belum ada variant aktif untuk game ini.
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {variantGroups.map((group) => (
        <div key={group.id} className="space-y-2">
          {group.name ? (
            <div className="flex items-center">
              <h3 className="text-[12px] font-semibold text-white/92 sm:text-[13px]">
                {group.name}
              </h3>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
            {group.variants.map((variant) => {
              const isSelected = selectedVariant?._id === variant._id;
              const variantLogo = variant.logo || "";

              return (
                <button
                  key={variant._id}
                  type="button"
                  onClick={() => onVariantSelect(variant._id)}
                  className={`group relative overflow-hidden rounded-[14px] border text-left transition ${
                    isSelected
                      ? "border-[var(--accent)] bg-[#34353b] shadow-[0_0_0_1px_var(--accent-glow)]"
                      : "border-white/8 bg-[#34353b] hover:border-[rgba(211,59,59,0.6)]"
                  }`}
                >
                  <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:10px_10px]" />

                  <div className="relative p-2.5 sm:p-3">
                    <p className="line-clamp-2 min-h-[1.65rem] text-[9.5px] font-medium leading-[1.04rem] text-white/92 sm:min-h-[1.8rem] sm:text-[11px] sm:leading-[1.12rem]">
                      {variant.name}
                    </p>

                    <div className="mt-1.5 flex items-center gap-2">
                      {variantLogo ? (
                        <Image
                          src={variantLogo}
                          alt={variant.name}
                          width={28}
                          height={28}
                          sizes="(max-width: 640px) 24px, 28px"
                          className="h-6 w-6 shrink-0 rounded-[8px] object-cover object-center sm:h-7 sm:w-7"
                        />
                      ) : (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-white/10 text-[11px] text-white/84 sm:h-7 sm:w-7 sm:text-xs">
                          ◆
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-[0.88rem] font-bold leading-none text-[var(--accent-strong)] sm:text-[1.04rem]">
                          {formatCurrency(variant.price, variant.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex justify-end">
                      <span className="rounded-[7px] bg-white px-2 py-[5px] text-[8px] font-semibold text-[#3f3f3f] sm:text-[9px]">
                        {variant.duration > 0 ? `${variant.duration} min` : "Instant"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuantityStepSection({
  quantity,
  onQuantityChange,
  disabled,
}: {
  quantity: number;
  onQuantityChange: (nextQuantity: number) => void;
  disabled: boolean;
}) {
  const normalizedQuantity = Math.min(Math.max(Number(quantity || 1), 1), 10);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={1}
          max={10}
          inputMode="numeric"
          value={normalizedQuantity}
          onChange={(event) => onQuantityChange(Number(event.target.value || 1))}
          disabled={disabled}
          className="topup-number-input h-11 min-w-0 flex-1 rounded-[14px] border border-white/8 bg-[#3a3b40] px-3.5 text-base text-white outline-none transition placeholder:text-white/28 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-[42px] sm:text-[13px]"
        />

        <button
          type="button"
          onClick={() => onQuantityChange(normalizedQuantity + 1)}
          disabled={disabled || normalizedQuantity >= 10}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#a88d62] text-xl font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:h-[42px] sm:w-[42px]"
        >
          +
        </button>

        <button
          type="button"
          onClick={() => onQuantityChange(normalizedQuantity - 1)}
          disabled={disabled || normalizedQuantity <= 1}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#7b6748] text-xl font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:h-[42px] sm:w-[42px]"
        >
          −
        </button>
      </div>

      <p className="text-[11px] text-white/45">
        Jumlah pembelian minimal 1 dan maksimal 10 kali untuk variant yang sama.
      </p>
    </div>
  );
}

export function PaymentStepSection({
  paymentMethods,
  paymentMethodGroups,
  openPaymentGroups,
  setOpenPaymentGroups,
  paymentMethodCode,
  onPaymentMethodSelect,
  selectedVariant,
  subtotal,
}: {
  paymentMethods: StorefrontPaymentMethod[];
  paymentMethodGroups: PaymentMethodGroup[];
  openPaymentGroups: Record<string, boolean>;
  setOpenPaymentGroups: Dispatch<SetStateAction<Record<string, boolean>>>;
  paymentMethodCode: string;
  onPaymentMethodSelect: (methodCode: string) => void;
  selectedVariant: StorefrontVariant | null;
  subtotal: number;
}) {
  if (paymentMethods.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-white/10 bg-[#242429] px-4 py-4 text-[13px] text-white/58">
        Belum ada metode pembayaran aktif yang tersedia.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {paymentMethodGroups.map((group) => {
        const isOpen = openPaymentGroups[group.id] ?? false;
        const hasSelectedMethod = group.methods.some(
          (paymentMethod) => paymentMethod.code === paymentMethodCode
        );

        return (
          <div
            key={group.id}
            className={`overflow-hidden rounded-[16px] border transition ${
              hasSelectedMethod
                ? "border-[var(--accent)] bg-[#3a3a3f] shadow-[0_0_0_1px_var(--accent-glow)]"
                : "border-white/8 bg-[#333338]"
            }`}
          >
            <button
              type="button"
              onClick={() =>
                setOpenPaymentGroups((current) => ({
                  ...current,
                  [group.id]: !isOpen,
                }))
              }
              className="flex w-full items-center justify-between gap-4 bg-[#26262b] px-4 py-3 text-left"
            >
              <span className="text-[12px] font-semibold text-white">
                {group.title}
              </span>
              <span className="text-sm text-white/72">{isOpen ? "▴" : "▾"}</span>
            </button>

            {isOpen ? (
              <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.methods.map((paymentMethod) => {
                  const isSelected = paymentMethodCode === paymentMethod.code;
                  const totalByMethod = selectedVariant
                    ? getPaymentTotal(subtotal, paymentMethod)
                    : 0;

                  return (
                    <button
                      key={paymentMethod.code}
                      type="button"
                      onClick={() => onPaymentMethodSelect(paymentMethod.code)}
                      className={`rounded-[14px] border px-3 py-3 text-left transition ${
                        isSelected
                          ? "border-[var(--accent)] bg-[#4b4b50] shadow-[0_0_0_1px_var(--accent-glow)]"
                          : "border-white/8 bg-[#4a4a4f] hover:border-[rgba(211,59,59,0.55)]"
                      }`}
                    >
                      <div className="flex min-h-[44px] items-start">
                        <PaymentMethodLogo paymentMethod={paymentMethod} />
                      </div>

                      <p className="mt-3 text-[12px] font-medium text-white/88">
                        {paymentMethod.name}
                      </p>

                      {paymentMethod.description ? (
                        <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/54">
                          {paymentMethod.description}
                        </p>
                      ) : null}

                      <p className="mt-2 text-[12px] font-semibold text-white">
                        {selectedVariant
                          ? formatCurrency(
                              totalByMethod,
                              paymentMethod.currency || selectedVariant.currency
                            )
                          : "Pilih nominal dulu"}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto px-4 py-3">
                <div className="flex min-w-max items-center justify-end gap-2">
                  {group.methods.map((paymentMethod) => (
                    <div
                      key={paymentMethod.code}
                      className={`rounded-[8px] transition ${
                        paymentMethodCode === paymentMethod.code
                          ? "ring-1 ring-[var(--accent)]"
                          : ""
                      }`}
                    >
                      <PaymentMethodLogo paymentMethod={paymentMethod} compact />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ContactStepSection({
  contactEmail,
  onContactEmailChange,
  contactPhoneCode,
  contactPhoneNumber,
  onContactPhoneChange,
}: {
  contactEmail: string;
  onContactEmailChange: (nextValue: string) => void;
  contactPhoneCode: string;
  contactPhoneNumber: string;
  onContactPhoneChange: (nextValue: string) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/88">
          Email
          <span className="text-[11px] text-white/45">(opsional)</span>
        </span>
        <input
          type="email"
          value={contactEmail}
          onChange={(event) => onContactEmailChange(event.target.value)}
          placeholder="example@gmail.com"
          className="h-11 w-full rounded-[14px] border border-white/8 bg-[#3a3b40] px-3.5 text-base text-white outline-none transition placeholder:text-white/28 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)] sm:h-[42px] sm:text-[13px]"
        />
      </label>

      <div className="space-y-2">
        <label className="block">
          <span className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/88">
            No. Kontak
            <span className="text-[11px] text-[var(--accent-soft)]">*</span>
          </span>
          <div className="flex h-11 overflow-hidden rounded-[14px] border border-white/8 bg-[#3a3b40] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-glow)] sm:h-[42px]">
            <div className="flex min-w-[74px] items-center gap-2 border-r border-white/8 px-3 text-[13px] text-white/84">
              <span>ID</span>
              <span>{contactPhoneCode}</span>
            </div>

            <input
              type="tel"
              value={contactPhoneNumber}
              onChange={(event) =>
                onContactPhoneChange(event.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="81234567890"
              inputMode="numeric"
              required
              className="topup-number-input h-full w-full bg-transparent px-3.5 text-base text-white outline-none placeholder:text-white/28 sm:text-[13px]"
            />
          </div>
        </label>

        <p className="text-[11px] italic text-white/45">
          *Nomor ini akan dihubungi jika terjadi masalah.
        </p>
      </div>

      <div className="rounded-[14px] border border-white/8 bg-[#3a3b40] px-3.5 py-3 text-[12px] text-white/62">
        Jika email diisi, bukti transaksi akan dikirim ke email tersebut.
      </div>
    </div>
  );
}
