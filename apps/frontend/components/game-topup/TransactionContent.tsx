"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";

import PromoCodeSection, {
  type AppliedPromoCode,
} from "@/components/PromoCodeSection";
import {
  type PaymentMethodGroup,
  type VariantGroup,
} from "@/components/game-topup/helpers";
import { StepPanel } from "@/components/game-topup/Panels";
import {
  AccountStepSection,
  ContactStepSection,
  PaymentStepSection,
  VariantStepSection,
} from "@/components/game-topup/TransactionSections";
import type {
  StorefrontGameInput,
  StorefrontPaymentMethod,
  StorefrontVariant,
} from "@/lib/siteData";

type HighlightedStep = "account" | "variant" | "payment" | "contact" | null;

type TransactionContentProps = {
  mobileBottomSpacing: string;
  mobileContentTab: "transaction" | "detail";
  showAccountStep: boolean;
  resolvedInputs: StorefrontGameInput[];
  accountValues: Record<string, string>;
  onAccountChange: (key: string, nextValue: string) => void;
  selectedVariant: StorefrontVariant | null;
  variantGroups: VariantGroup[];
  onVariantSelect: (variantId: string) => void;
  variantStepNumber: number;
  paymentMethods: StorefrontPaymentMethod[];
  paymentMethodGroups: PaymentMethodGroup[];
  openPaymentGroups: Record<string, boolean>;
  setOpenPaymentGroups: Dispatch<SetStateAction<Record<string, boolean>>>;
  paymentMethodCode: string;
  onPaymentMethodSelect: (methodCode: string) => void;
  paymentStepNumber: number;
  contactEmail: string;
  onContactEmailChange: (nextValue: string) => void;
  contactPhoneCode: string;
  contactPhoneNumber: string;
  onContactPhoneChange: (nextValue: string) => void;
  contactStepNumber: number;
  promoStepNumber: number;
  gameCategory: string;
  baseSubtotal: number;
  selectedCurrency: string;
  onPromoChange: (promoCode: AppliedPromoCode | null) => void;
  accountStepRef: RefObject<HTMLDivElement | null>;
  variantStepRef: RefObject<HTMLDivElement | null>;
  paymentStepRef: RefObject<HTMLDivElement | null>;
  contactStepRef: RefObject<HTMLDivElement | null>;
  highlightedStep: HighlightedStep;
};

function highlightClass(
  highlightedStep: HighlightedStep,
  step: Exclude<HighlightedStep, null>
) {
  return highlightedStep === step
    ? "border-[rgba(211,59,59,0.55)] shadow-[0_0_0_1px_rgba(211,59,59,0.22),0_18px_32px_rgba(0,0,0,0.18)]"
    : "";
}

export default function TransactionContent({
  mobileBottomSpacing,
  mobileContentTab,
  showAccountStep,
  resolvedInputs,
  accountValues,
  onAccountChange,
  selectedVariant,
  variantGroups,
  onVariantSelect,
  variantStepNumber,
  paymentMethods,
  paymentMethodGroups,
  openPaymentGroups,
  setOpenPaymentGroups,
  paymentMethodCode,
  onPaymentMethodSelect,
  paymentStepNumber,
  contactEmail,
  onContactEmailChange,
  contactPhoneCode,
  contactPhoneNumber,
  onContactPhoneChange,
  contactStepNumber,
  promoStepNumber,
  gameCategory,
  baseSubtotal,
  selectedCurrency,
  onPromoChange,
  accountStepRef,
  variantStepRef,
  paymentStepRef,
  contactStepRef,
  highlightedStep,
}: TransactionContentProps) {
  return (
    <div
      className={`space-y-6 ${mobileBottomSpacing} ${
        mobileContentTab === "transaction" ? "block" : "hidden md:block"
      }`}
    >
      {showAccountStep ? (
        <div ref={accountStepRef}>
          <StepPanel
            number={1}
            title="Masukkan Data Akun"
            className={highlightClass(highlightedStep, "account")}
          >
            <AccountStepSection
              resolvedInputs={resolvedInputs}
              accountValues={accountValues}
              onAccountChange={onAccountChange}
            />
          </StepPanel>
        </div>
      ) : null}

      <div ref={variantStepRef}>
        <StepPanel
          number={variantStepNumber}
          title="Pilih Nominal"
          className={highlightClass(highlightedStep, "variant")}
        >
          <VariantStepSection
            variantGroups={variantGroups}
            selectedVariant={selectedVariant}
            onVariantSelect={onVariantSelect}
          />
        </StepPanel>
      </div>

      <div ref={paymentStepRef}>
        <StepPanel
          number={paymentStepNumber}
          title="Pilih Pembayaran"
          className={highlightClass(highlightedStep, "payment")}
        >
          <PaymentStepSection
            paymentMethods={paymentMethods}
            paymentMethodGroups={paymentMethodGroups}
            openPaymentGroups={openPaymentGroups}
            setOpenPaymentGroups={setOpenPaymentGroups}
            paymentMethodCode={paymentMethodCode}
            onPaymentMethodSelect={onPaymentMethodSelect}
            selectedVariant={selectedVariant}
          />
        </StepPanel>
      </div>

      <div ref={contactStepRef}>
        <StepPanel
          number={contactStepNumber}
          title="Detail Kontak"
          className={highlightClass(highlightedStep, "contact")}
        >
          <ContactStepSection
            contactEmail={contactEmail}
            onContactEmailChange={onContactEmailChange}
            contactPhoneCode={contactPhoneCode}
            contactPhoneNumber={contactPhoneNumber}
            onContactPhoneChange={onContactPhoneChange}
          />
        </StepPanel>
      </div>

      <div>
        <StepPanel number={promoStepNumber} title="Kode Promo">
          <PromoCodeSection
            category={gameCategory}
            subtotal={baseSubtotal}
            currency={selectedCurrency}
            disabled={!selectedVariant}
            onPromoChange={onPromoChange}
          />
        </StepPanel>
      </div>
    </div>
  );
}
