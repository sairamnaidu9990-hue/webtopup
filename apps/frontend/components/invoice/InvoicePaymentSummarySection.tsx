import Image from "next/image";

import CopyValueIconButton from "@/components/invoice/CopyValueIconButton";
import InvoiceDetailRow from "@/components/invoice/InvoiceDetailRow";
import {
  formatCurrency,
  formatDateTime,
  getStatusLabel,
} from "@/components/invoice/invoicePageUtils";
import type { StorefrontOrder } from "@/lib/siteData";

function formatCustomerInputLabel(title: string, fallbackName: string) {
  return String(title || fallbackName || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function InvoicePaymentSummarySection({
  order,
  productImage,
  displayGameProvider,
  paymentMethodName,
  paymentCurrency,
  isManualPayment,
  manualAccountNumber,
  manualAccountHolderName,
  normalizedPaymentStatus,
  shouldHideGatewayPaymentAccess,
  paymentInstructionLines,
  paymentActionUrl,
  hasPaymentGatewayData,
}: {
  order: StorefrontOrder;
  productImage: string;
  displayGameProvider: string;
  paymentMethodName: string;
  paymentCurrency: string;
  isManualPayment: boolean;
  manualAccountNumber: string;
  manualAccountHolderName: string;
  normalizedPaymentStatus: string;
  shouldHideGatewayPaymentAccess: boolean;
  paymentInstructionLines: string[];
  paymentActionUrl: string;
  hasPaymentGatewayData: boolean;
}) {
  const visibleCustomerInputs = Array.isArray(order.customerInputs)
    ? order.customerInputs.filter((item) => String(item?.value || "").trim())
    : [];
  const paymentProcessLabel = isManualPayment
    ? "Verifikasi manual"
    : "Proses otomatis";

  return (
    <section className="space-y-4 rounded-[20px] border border-white/8 bg-[#24262d] p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <div className="overflow-hidden rounded-[18px] border border-white/8 bg-[#31333b] shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
          {productImage ? (
            <Image
              src={productImage}
              alt={order.gameSnapshot.name || order.variantSnapshot.name}
              width={88}
              height={88}
              sizes="88px"
              className="h-[88px] w-[88px] object-cover object-center"
            />
          ) : (
            <div className="flex h-[88px] w-[88px] items-center justify-center bg-[#2d2f36] text-2xl text-white/70">
              ◆
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">
            Product Dipilih
          </p>
          <h2 className="text-[1.02rem] font-semibold leading-snug text-white sm:text-[1.12rem]">
            {order.variantSnapshot.name || "Variant belum tersedia"}
          </h2>
          <p className="text-[13px] text-white/62 sm:text-[14px]">
            {order.gameSnapshot.name}
            {displayGameProvider ? ` • ${displayGameProvider}` : ""}
          </p>
          {visibleCustomerInputs.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {visibleCustomerInputs.map((input, index) => {
                const label = formatCustomerInputLabel(input.title, input.name);

                return (
                  <span
                    key={`${input.name}-${input.value}-${index}`}
                    className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.05] px-2.5 py-1 text-[11px] text-white/72"
                  >
                    <span className="text-white/44">{label || "Data"}</span>
                    <span className="font-medium text-white">{input.value}</span>
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <dl className="divide-y divide-white/8">
        <InvoiceDetailRow
          label="Harga"
          value={formatCurrency(order.price.sellPrice, paymentCurrency)}
        />
        {order.promoSnapshot?.code ? (
          <>
            <InvoiceDetailRow
              label="Kode Promo"
              value={order.promoSnapshot.code}
            />
            <InvoiceDetailRow
              label="Diskon Promo"
              value={`-${formatCurrency(order.price.promoDiscount, paymentCurrency)}`}
            />
          </>
        ) : null}
        <InvoiceDetailRow
          label="Biaya Pembayaran"
          value={formatCurrency(order.price.paymentFee, paymentCurrency)}
        />
        <InvoiceDetailRow label="Metode Pembayaran" value={paymentMethodName} />
        <InvoiceDetailRow
          label="Total Pembayaran"
          value={formatCurrency(order.price.totalAmount, paymentCurrency)}
          emphasized
        />
      </dl>

      <section className="rounded-[18px] border border-white/8 bg-[#2b2e35] p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-white">Pembayaran</h3>
            <p className="mt-1 text-[12px] leading-5 text-white/56 sm:text-[13px]">
              {isManualPayment
                ? "Transfer ke rekening di bawah ini lalu tunggu verifikasi pembayaran dari admin."
                : hasPaymentGatewayData
                  ? "Selesaikan pembayaran sesuai metode yang sudah kamu pilih."
                  : "Menunggu data pembayaran dari gateway."}
            </p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/74">
            {paymentMethodName || "Metode Pembayaran"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(180px,0.8fr)]">
          <div className="rounded-[16px] border border-dashed border-white/10 bg-[#24262d] px-4 py-5 text-center">
            {isManualPayment ? (
              manualAccountNumber ? (
                <div className="space-y-3">
                  <div className="mx-auto flex min-h-28 w-full max-w-[260px] flex-col items-center justify-center rounded-[16px] border border-white/8 bg-[linear-gradient(135deg,#20232a_0%,#171a21_100%)] px-4 py-4 text-center">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">
                      No. Rekening
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-[17px] font-semibold tracking-[0.06em] text-white">
                        {manualAccountNumber}
                      </p>
                      <CopyValueIconButton
                        value={manualAccountNumber}
                        label="Copy nomor rekening"
                      />
                    </div>
                    {manualAccountHolderName ? (
                      <p className="mt-2 text-[12px] text-white/72">
                        a.n. {manualAccountHolderName}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-[12px] text-white/54">
                    Lakukan transfer sesuai total pembayaran ke rekening ini.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mx-auto flex h-28 w-full max-w-[240px] items-center justify-center rounded-[16px] border border-white/8 bg-[linear-gradient(135deg,#20232a_0%,#171a21_100%)] text-[12px] font-medium text-white/40">
                    Rekening Manual Belum Diatur
                  </div>
                  <p className="mt-3 text-[12px] text-white/46">
                    Admin belum melengkapi informasi rekening untuk metode pembayaran ini.
                  </p>
                </>
              )
            ) : shouldHideGatewayPaymentAccess ? (
              <>
                <div className="mx-auto flex h-28 w-full max-w-[240px] items-center justify-center rounded-[16px] border border-white/8 bg-[linear-gradient(135deg,#20232a_0%,#171a21_100%)] px-4 text-[12px] font-medium text-white/44">
                  {normalizedPaymentStatus === "PAID"
                    ? "Pembayaran Sudah Diterima"
                    : normalizedPaymentStatus === "EXPIRED"
                      ? "Pembayaran Telah Kedaluwarsa"
                      : "Akses Pembayaran Ditutup"}
                </div>
                <p className="mt-3 text-[12px] text-white/46">
                  {normalizedPaymentStatus === "PAID"
                    ? ""
                    : normalizedPaymentStatus === "EXPIRED"
                      ? ""
                      : "Akses pembayaran sudah ditutup untuk status transaksi ini."}
                </p>
              </>
            ) : order.paymentGateway.qrLink ? (
              <div className="space-y-3">
                <div className="mx-auto overflow-hidden rounded-[16px] border border-white/8 bg-white p-3 shadow-[0_10px_22px_rgba(0,0,0,0.18)]">
                  <Image
                    src={order.paymentGateway.qrLink}
                    alt="QR Pembayaran"
                    width={220}
                    height={220}
                    sizes="(max-width: 640px) 190px, 220px"
                    className="mx-auto h-auto w-full max-w-[220px] object-contain"
                  />
                </div>
                <p className="text-[12px] text-white/54">
                  Scan QR ini untuk menyelesaikan pembayaran.
                </p>
              </div>
            ) : order.paymentGateway.virtualAccountNumber ? (
              <div className="space-y-3">
                <div className="mx-auto flex h-28 w-full max-w-[240px] items-center justify-center rounded-[16px] border border-white/8 bg-[linear-gradient(135deg,#20232a_0%,#171a21_100%)] px-4 text-[13px] font-semibold tracking-[0.08em] text-white">
                  {order.paymentGateway.virtualAccountNumber}
                </div>
                <p className="text-[12px] text-white/54">
                  Gunakan nomor virtual account ini untuk melakukan pembayaran.
                </p>
              </div>
            ) : paymentActionUrl ? (
              <div className="space-y-3">
                <div className="mx-auto flex h-28 w-full max-w-[240px] items-center justify-center rounded-[16px] border border-white/8 bg-[linear-gradient(135deg,#20232a_0%,#171a21_100%)] px-4 text-[12px] font-medium text-white/52">
                  Link Pembayaran Tersedia
                </div>
                <a
                  href={paymentActionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,var(--accent-strong)_0%,var(--accent)_100%)] px-5 text-[13px] font-semibold text-white shadow-[0_14px_28px_var(--accent-glow)] transition hover:brightness-105"
                >
                  Buka Halaman Pembayaran
                </a>
              </div>
            ) : (
              <>
                <div className="mx-auto flex h-28 w-full max-w-[240px] items-center justify-center rounded-[16px] border border-white/8 bg-[linear-gradient(135deg,#20232a_0%,#171a21_100%)] text-[12px] font-medium text-white/40">
                  QR / Link Pembayaran
                </div>
                <p className="mt-3 text-[12px] text-white/46">
                  Data pembayaran akan muncul di sini setelah transaksi gateway berhasil dibuat.
                </p>
              </>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-[16px] border border-white/8 bg-[#24262d] px-4 py-3.5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">
                Metode
              </p>
              <p className="mt-1 text-[13px] font-medium text-white/88">
                {paymentMethodName}
              </p>
              <p className="mt-1 text-[11px] text-white/46">
                {paymentProcessLabel}
              </p>
            </div>
            <div className="rounded-[16px] border border-white/8 bg-[#24262d] px-4 py-3.5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">
                Total Bayar
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-[15px] font-semibold text-white">
                  {formatCurrency(order.price.totalAmount, paymentCurrency)}
                </p>
                <CopyValueIconButton
                  value={String(order.price.totalAmount || 0)}
                  label="Copy total bayar"
                />
              </div>
            </div>
            <div className="rounded-[16px] border border-white/8 bg-[#24262d] px-4 py-3.5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">
                Status
              </p>
              <p className="mt-1 text-[13px] font-medium text-white/88">
                {getStatusLabel(order.paymentStatus)}
              </p>
            </div>
            {isManualPayment && manualAccountHolderName ? (
              <div className="rounded-[16px] border border-white/8 bg-[#24262d] px-4 py-3.5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">
                  Nama Rekening
                </p>
                <p className="mt-1 text-[13px] font-medium text-white/88">
                  {manualAccountHolderName}
                </p>
              </div>
            ) : null}
            {order.paymentGateway.virtualAccountNumber &&
            !shouldHideGatewayPaymentAccess ? (
              <div className="rounded-[16px] border border-white/8 bg-[#24262d] px-4 py-3.5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">
                  Nomor VA
                </p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="text-[13px] font-medium text-white/88">
                    {order.paymentGateway.virtualAccountNumber}
                  </p>
                  <CopyValueIconButton
                    value={order.paymentGateway.virtualAccountNumber}
                    label="Copy nomor virtual account"
                  />
                </div>
              </div>
            ) : null}
            {order.paymentGateway.expiresAt ? (
              <div className="rounded-[16px] border border-white/8 bg-[#24262d] px-4 py-3.5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">
                  Batas Bayar
                </p>
                <p className="mt-1 text-[13px] font-medium text-white/88">
                  {formatDateTime(order.paymentGateway.expiresAt)}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {paymentInstructionLines.length > 0 && !shouldHideGatewayPaymentAccess ? (
          <div className="mt-4 rounded-[16px] border border-white/8 bg-[#24262d] px-4 py-4">
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/52">
              Instruksi Pembayaran
            </h4>
            <ol className="mt-3 space-y-2 text-[12px] leading-6 text-white/72 sm:text-[13px]">
              {paymentInstructionLines.map((line, index) => (
                <li key={`${line}-${index}`} className="flex gap-2">
                  <span className="text-white/38">{index + 1}.</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>
    </section>
  );
}
