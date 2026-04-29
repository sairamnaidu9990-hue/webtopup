"use client";

import { createPortal } from "react-dom";
import DetailContent from "@/components/game-topup/DetailContent";
import DesktopCheckoutSidebar from "@/components/game-topup/DesktopCheckoutSidebar";
import MobileContentTabs from "@/components/game-topup/MobileContentTabs";
import TransactionContent from "@/components/game-topup/TransactionContent";
import MobileCheckoutBar from "@/components/game-topup/MobileCheckoutBar";
import useGameTopupFlow from "@/components/game-topup/useGameTopupFlow";
import type {
  StorefrontGameDetail,
  StorefrontPaymentMethod,
  StorefrontGameReviewSummary,
  StorefrontVariant,
} from "@/lib/siteData";

type GameDetail = StorefrontGameDetail["game"];

type GameTopupPanelProps = {
  game: GameDetail;
  variants: StorefrontVariant[];
  paymentMethods: StorefrontPaymentMethod[];
  categoryDescription?: string;
  gameFaqs?: Array<{
    question: string;
    answer: string;
  }>;
  reviewSummary: StorefrontGameReviewSummary;
};

export default function GameTopupPanel({
  game,
  variants,
  paymentMethods,
  categoryDescription = "",
  gameFaqs = [],
  reviewSummary,
}: GameTopupPanelProps) {
  const flow = useGameTopupFlow({
    game,
    variants,
    paymentMethods,
  });

  return (
    <div className="site-shell pt-8 sm:pt-10">
      <div className="space-y-6 xl:grid xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] xl:items-start xl:gap-8 xl:space-y-0">
        <MobileContentTabs
          activeTab={flow.mobileContentTab}
          onChange={flow.setMobileContentTab}
        />

        {flow.selectionAlert ? (
          <div className="pointer-events-none fixed left-1/2 top-3 z-50 flex w-full -translate-x-1/2 justify-center px-4 md:top-4">
            <div className="pointer-events-auto inline-flex max-w-full items-center gap-3 rounded-[14px] border border-red-100 bg-white px-4 py-3 text-[13px] font-medium text-[#454545] shadow-[0_12px_24px_rgba(0,0,0,0.18)]">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff5a52] text-[13px] font-bold text-white">
                ×
              </span>
              <span>{flow.selectionAlert.message}</span>
            </div>
          </div>
        ) : null}

        {flow.successToast ? (
          <div className="pointer-events-none fixed left-1/2 top-3 z-50 flex w-full -translate-x-1/2 justify-center px-4 md:top-4">
            <div className="pointer-events-auto inline-flex max-w-full items-center gap-3 rounded-[14px] border border-emerald-100 bg-white px-4 py-3 text-[13px] font-medium text-[#454545] shadow-[0_12px_24px_rgba(0,0,0,0.18)]">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[12px] font-bold text-white">
                ✓
              </span>
              <span>{flow.successToast.message}</span>
            </div>
          </div>
        ) : null}

        <TransactionContent
          mobileBottomSpacing={flow.mobileBottomSpacing}
          mobileContentTab={flow.mobileContentTab}
          showAccountStep={flow.showAccountStep}
          resolvedInputs={flow.resolvedInputs}
          accountValues={flow.accountValues}
          onAccountChange={flow.handleAccountValueChange}
          selectedVariant={flow.selectedVariant}
          variantGroups={flow.variantGroups}
          onVariantSelect={flow.handleVariantSelect}
          variantStepNumber={flow.variantStepNumber}
          paymentMethods={paymentMethods}
          paymentMethodGroups={flow.paymentMethodGroups}
          openPaymentGroups={flow.openPaymentGroups}
          setOpenPaymentGroups={flow.setOpenPaymentGroups}
          paymentMethodCode={flow.paymentMethodCode}
          onPaymentMethodSelect={flow.handlePaymentMethodSelect}
          paymentStepNumber={flow.paymentStepNumber}
          contactEmail={flow.contactEmail}
          onContactEmailChange={flow.handleContactEmailChange}
          contactPhoneCode={flow.contactPhoneCode}
          contactPhoneNumber={flow.contactPhoneNumber}
          onContactPhoneChange={flow.handleContactPhoneChange}
          contactStepNumber={flow.contactStepNumber}
          promoStepNumber={flow.promoStepNumber}
          gameCategory={game.category || ""}
          baseSubtotal={flow.baseSubtotal}
          selectedCurrency={flow.selectedVariant?.currency || "IDR"}
          onPromoChange={flow.handlePromoChange}
          accountStepRef={flow.accountStepRef}
          variantStepRef={flow.variantStepRef}
          paymentStepRef={flow.paymentStepRef}
          contactStepRef={flow.contactStepRef}
          highlightedStep={flow.highlightedStep}
        />

        <DesktopCheckoutSidebar
          game={game}
          reviewSummary={reviewSummary}
          selectedVariant={flow.selectedVariant}
          createdOrder={flow.createdOrder}
          baseSubtotal={flow.baseSubtotal}
          appliedPromo={flow.appliedPromo}
          promoDiscount={flow.promoDiscount}
          paymentFee={flow.paymentFee}
          selectedPaymentMethod={flow.selectedPaymentMethod}
          totalPayment={flow.totalPayment}
          isCreatingOrder={flow.isCreatingOrder}
          onOrderClick={flow.handleOrderClick}
        />

        <DetailContent
          mobileContentTab={flow.mobileContentTab}
          categoryDescription={categoryDescription}
          gameName={game.name}
          reviewSummary={reviewSummary}
          reviewPageHref={flow.reviewPageHref}
          gameFaqs={gameFaqs}
          openFaqItems={flow.openFaqItems}
          onToggleFaq={flow.toggleFaqItem}
        />
      </div>

      {flow.mobileCheckoutMounted && flow.mobileContentTab === "transaction"
        ? createPortal(
            <div
              className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-[rgba(20,22,27,0.96)] md:hidden"
              style={{
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
              }}
            >
              <MobileCheckoutBar
                selectedVariant={flow.selectedVariant}
                createdOrder={flow.createdOrder}
                totalPayment={flow.totalPayment}
                baseSubtotal={flow.baseSubtotal}
                paymentFee={flow.paymentFee}
                appliedPromo={flow.appliedPromo}
                promoDiscount={flow.promoDiscount}
                isMobileSummaryExpanded={flow.isMobileSummaryExpanded}
                onToggleExpanded={() =>
                  flow.setIsMobileSummaryExpanded((current) => !current)
                }
                onOrderClick={flow.handleOrderClick}
                isCreatingOrder={flow.isCreatingOrder}
              />
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
