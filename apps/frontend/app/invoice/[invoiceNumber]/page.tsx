import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";
import InvoiceAutoRefresh from "@/components/invoice/InvoiceAutoRefresh";
import CopyInvoiceButton from "@/components/invoice/CopyInvoiceButton";
import InvoiceNotFoundState from "@/components/invoice/InvoiceNotFoundState";
import InvoicePaymentTimer from "@/components/invoice/InvoicePaymentTimer";
import InvoicePaymentSummarySection from "@/components/invoice/InvoicePaymentSummarySection";
import InvoiceProgressSection from "@/components/invoice/InvoiceProgressSection";
import InvoiceReviewCard from "@/components/invoice/InvoiceReviewCard";
import {
  extractInstructionLines,
  getTransactionProgress,
  shouldAutoRefreshOrder,
  shouldHideInternalProvider,
} from "@/components/invoice/invoicePageUtils";
import {
  getPublicOrderByInvoice,
  getPublicSiteSetting,
} from "@/lib/siteData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}): Promise<Metadata> {
  const [{ invoiceNumber }, siteSetting] = await Promise.all([
    params,
    getPublicSiteSetting(),
  ]);

  if (siteSetting.maintenanceModeEnabled) {
    return {
      title: `${siteSetting.siteName} Sedang Maintenance`,
      description: siteSetting.maintenanceMessage,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const order = await getPublicOrderByInvoice(invoiceNumber);

  if (!order) {
    return {
      title: `Invoice tidak ditemukan | ${siteSetting.siteName}`,
    };
  }

  return {
    title: `Invoice ${order.invoiceNumber} | ${siteSetting.siteName}`,
    description: `Invoice untuk pesanan ${order.gameSnapshot.name} - ${order.variantSnapshot.name}.`,
    openGraph:
      order.variantSnapshot.logo || order.gameSnapshot.logo
        ? {
            images: [
              {
                url: order.variantSnapshot.logo || order.gameSnapshot.logo,
                alt: order.variantSnapshot.name || order.gameSnapshot.name,
              },
            ],
          }
        : undefined,
  };
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}) {
  const { invoiceNumber } = await params;
  const order = await getPublicOrderByInvoice(invoiceNumber);

  if (!order) {
    return (
      <InvoiceNotFoundState
        invoiceNumber={String(invoiceNumber || "").trim().toUpperCase()}
      />
    );
  }

  const paymentCurrency = order.price.currency || order.variantSnapshot.currency || "IDR";
  const productImage = order.gameSnapshot.logo || "";
  const transactionProgress = getTransactionProgress(order);
  const shouldAutoRefresh = shouldAutoRefreshOrder(order);
  const displayGameProvider = shouldHideInternalProvider(order.gameSnapshot.provider)
    ? ""
    : order.gameSnapshot.provider;
  const paymentMethodName =
    order.paymentMethodSnapshot.name || order.paymentMethodName || "-";
  const normalizedPaymentStatus = String(order.paymentStatus || "")
    .trim()
    .toUpperCase();

  const normalizedOrderStatus = String(order.status || "")
    .trim()
    .toUpperCase();

  const normalizedProviderStatus = String(order.providerStatus || "")
    .trim()
    .toUpperCase();

  const shouldTrackPurchaseConversion =
    normalizedPaymentStatus === "PAID" ||
    normalizedOrderStatus === "SUCCESS" ||
    normalizedProviderStatus === "SUCCESS";

  const isManualPayment =
    String(order.paymentMethodSnapshot.provider || "")
      .trim()
      .toLowerCase() === "manual";
  const shouldHideGatewayPaymentAccess =
    !isManualPayment &&
    ["PAID", "EXPIRED", "FAILED", "REFUNDED"].includes(normalizedPaymentStatus);
  const manualAccountNumber = order.paymentMethodSnapshot.accountNumber || "";
  const manualAccountHolderName =
    order.paymentMethodSnapshot.accountHolderName || "";
  const paymentInstructionLines = extractInstructionLines(
    order.paymentGateway.instructionsHtml
  );
  const paymentActionUrl =
    order.paymentGateway.checkoutUrl || order.paymentGateway.payUrl;
  const hasPaymentGatewayData = Boolean(
    order.paymentGateway.qrLink ||
      order.paymentGateway.virtualAccountNumber ||
      paymentActionUrl
  );
  const mobileStatusAlert =
    normalizedOrderStatus === "SUCCESS"
      ? "Status berhasil diproses"
      : null;

  return (
    <>
      {shouldTrackPurchaseConversion ? (
        <Script id={`google-ads-purchase-${order.invoiceNumber}`} strategy="afterInteractive">
          {`
            gtag('event', 'conversion', {
              'send_to': 'AW-18122131749/GV_PCMbLjqMcEKWSp8FD',
              'value': ${Number(order.price.totalAmount || 1)},
              'currency': '${paymentCurrency || "IDR"}',
              'transaction_id': '${order.invoiceNumber}'
            });
          `}
        </Script>
      ) : null}

      <main className="site-shell py-8 sm:py-10">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(135deg,#1d2027_0%,#17191f_100%)] shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
            <div className="border-b border-white/8 bg-[linear-gradient(180deg,rgba(211,59,59,0.18)_0%,rgba(211,59,59,0.06)_100%)] px-5 py-5 sm:px-6">
              <div className="space-y-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--accent-soft)]">
                  Nomor Invoice
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <h1 className="font-[family-name:var(--font-display)] text-[1.35rem] font-bold tracking-tight text-white sm:text-[1.8rem]">
                    {order.invoiceNumber}
                  </h1>
                  <CopyInvoiceButton invoiceNumber={order.invoiceNumber} />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <InvoiceAutoRefresh enabled={shouldAutoRefresh} />
                </div>
              </div>
            </div>

            <InvoiceProgressSection steps={transactionProgress} />

            <div className="space-y-4 px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <InvoicePaymentTimer
                  createdAt={order.createdAt}
                  expiresAt={order.paymentGateway.expiresAt}
                  paymentStatus={order.paymentStatus}
                />
                {mobileStatusAlert ? (
                  <div className="inline-flex min-h-[44px] items-center rounded-[14px] border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-[12px] font-semibold text-emerald-200 shadow-[0_10px_24px_rgba(34,197,94,0.12)] md:hidden">
                    {mobileStatusAlert}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-5 md:grid-cols-[minmax(0,1.55fr)_minmax(290px,0.95fr)]">
                <InvoicePaymentSummarySection
                  order={order}
                  productImage={productImage}
                  displayGameProvider={displayGameProvider}
                  paymentMethodName={paymentMethodName}
                  paymentCurrency={paymentCurrency}
                  isManualPayment={isManualPayment}
                  manualAccountNumber={manualAccountNumber}
                  manualAccountHolderName={manualAccountHolderName}
                  normalizedPaymentStatus={normalizedPaymentStatus}
                  shouldHideGatewayPaymentAccess={shouldHideGatewayPaymentAccess}
                  paymentInstructionLines={paymentInstructionLines}
                  paymentActionUrl={paymentActionUrl}
                  hasPaymentGatewayData={hasPaymentGatewayData}
                />
                <aside className="hidden md:block" aria-hidden="true">
                  <div className="min-h-full rounded-[20px] border border-transparent" />
                </aside>
              </div>
            </div>
          </section>

          {order.review?.canSubmit || order.review?.hasSubmitted ? (
            <InvoiceReviewCard
              invoiceNumber={order.invoiceNumber}
              gameName={order.gameSnapshot.name}
              initialReviewState={order.review}
            />
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-[14px] border border-white/8 bg-white/5 px-5 text-[13px] font-medium text-white transition hover:bg-white/8"
            >
              Kembali ke Home
            </Link>
            {order.gameSnapshot.code ? (
              <Link
                href={`/games/${order.gameSnapshot.code.toLowerCase()}`}
                className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,var(--accent-strong)_0%,var(--accent)_100%)] px-5 text-[13px] font-semibold text-white shadow-[0_14px_28px_var(--accent-glow)] transition hover:brightness-105"
              >
                Kembali ke Halaman Game
              </Link>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}
