import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import CopyInvoiceButton from "@/components/invoice/CopyInvoiceButton";
import CopyValueIconButton from "@/components/invoice/CopyValueIconButton";
import {
  getPublicOrderByInvoice,
  getPublicSiteSetting,
  type StorefrontOrder,
} from "@/lib/siteData";

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency || "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency || "IDR"} ${value}`;
  }
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(status: string) {
  const normalizedStatus = String(status || "").trim().toUpperCase();

  switch (normalizedStatus) {
    case "UNPAID":
      return "Belum Dibayar";
    case "PAID":
      return "Sudah Dibayar";
    case "PROCESSING":
      return "Diproses";
    case "SUCCESS":
      return "Berhasil";
    case "FAILED":
      return "Gagal";
    case "REFUNDED":
      return "Refund";
    case "EXPIRED":
      return "Kedaluwarsa";
    case "PENDING":
      return "Menunggu";
    default:
      return normalizedStatus || "-";
  }
}

function shouldHideInternalProvider(value?: string) {
  return String(value || "").trim().toLowerCase().includes("bangjeff");
}

function getStatusClassName(status: string) {
  const normalizedStatus = String(status || "").trim().toUpperCase();

  switch (normalizedStatus) {
    case "SUCCESS":
    case "PAID":
      return "border-emerald-400/25 bg-emerald-500/12 text-emerald-100";
    case "PROCESSING":
    case "PENDING":
      return "border-sky-400/20 bg-sky-500/12 text-sky-100";
    case "FAILED":
    case "EXPIRED":
      return "border-rose-400/20 bg-rose-500/12 text-rose-100";
    default:
      return "border-[var(--accent)]/20 bg-[var(--accent-glow)] text-white";
  }
}

type TransactionStepState =
  | "done"
  | "current"
  | "upcoming"
  | "error"
  | "success";

type TransactionStep = {
  title: string;
  description: string;
  state: TransactionStepState;
};

function getTransactionProgress(order: StorefrontOrder): TransactionStep[] {
  const orderStatus = String(order.status || "").trim().toUpperCase();
  const paymentStatus = String(order.paymentStatus || "").trim().toUpperCase();
  const providerStatus = String(order.providerStatus || "").trim().toUpperCase();

  const paymentStep: TransactionStep = {
    title: "Pembayaran",
    description: "Menunggu pembayaran dari kamu.",
    state: "current",
  };

  if (paymentStatus === "PAID") {
    paymentStep.description = "Pembayaran telah berhasil diterima.";
    paymentStep.state = "done";
  } else if (paymentStatus === "EXPIRED") {
    paymentStep.description = "Pembayaran telah kedaluwarsa.";
    paymentStep.state = "error";
  } else if (paymentStatus === "FAILED") {
    paymentStep.description = "Pembayaran gagal diproses.";
    paymentStep.state = "error";
  } else if (paymentStatus === "REFUNDED") {
    paymentStep.description = "Pembayaran telah direfund.";
    paymentStep.state = "done";
  }

  const processStep: TransactionStep = {
    title: "Sedang Di Proses",
    description: "Menunggu pembayaran berhasil.",
    state: "upcoming",
  };

  if (paymentStatus === "PAID" || orderStatus === "PROCESSING") {
    processStep.description = "Pembelian sedang dalam proses.";
    processStep.state = "current";
  }

  if (providerStatus === "PROCESSING" || providerStatus === "PENDING") {
    processStep.description = "Pembelian sedang dalam proses.";
    processStep.state = "current";
  }

  if (orderStatus === "SUCCESS" || providerStatus === "SUCCESS") {
    processStep.description = "Pembelian telah selesai diproses.";
    processStep.state = "done";
  } else if (orderStatus === "FAILED" || providerStatus === "FAILED") {
    processStep.description = "Pesanan gagal diproses oleh provider.";
    processStep.state = "error";
  }

  const completedStep: TransactionStep = {
    title: "Transaksi Selesai",
    description: "Transaksi akan selesai setelah proses provider berhasil.",
    state: "upcoming",
  };

  if (orderStatus === "SUCCESS" || providerStatus === "SUCCESS") {
    completedStep.description = "Transaksi telah berhasil dilakukan.";
    completedStep.state = "success";
  } else if (orderStatus === "FAILED") {
    completedStep.description = "Transaksi gagal diselesaikan.";
    completedStep.state = "error";
  } else if (orderStatus === "REFUNDED") {
    completedStep.description = "Transaksi telah direfund.";
    completedStep.state = "error";
  }

  if (paymentStep.state === "error") {
    processStep.state = "upcoming";
    processStep.description = "Menunggu pembayaran berhasil.";
    completedStep.state = "upcoming";
    completedStep.description =
      "Transaksi akan selesai setelah proses provider berhasil.";
  }

  return [
    {
      title: "Transaksi Dibuat",
      description: "Transaksi telah berhasil dibuat.",
      state: "done",
    },
    paymentStep,
    processStep,
    completedStep,
  ];
}

function getStepCircleClassName(state: TransactionStepState) {
  switch (state) {
    case "done":
      return "border-emerald-400 bg-emerald-500 text-white shadow-[0_0_0_6px_rgba(34,197,94,0.14)]";
    case "success":
      return "border-emerald-400 bg-[#2a2d33] text-white shadow-[0_0_0_6px_rgba(34,197,94,0.14)]";
    case "current":
      return "border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_0_0_6px_var(--accent-glow)]";
    case "error":
      return "border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_0_0_6px_var(--accent-glow)]";
    default:
      return "border-white/12 bg-[#23262d] text-white/54";
  }
}

function getStepTextClassName(state: TransactionStepState) {
  switch (state) {
    case "done":
    case "success":
      return "text-emerald-300";
    case "current":
    case "error":
      return "text-[var(--accent-soft)]";
    default:
      return "text-white";
  }
}

function getStepDescriptionClassName(state: TransactionStepState) {
  switch (state) {
    case "done":
    case "success":
      return "text-emerald-100/88";
    case "current":
    case "error":
      return "text-white/92";
    default:
      return "text-white/74";
  }
}

function getConnectorClassName(
  currentStep: TransactionStep,
  nextStep: TransactionStep
) {
  if (
    currentStep.state === "done" &&
    (nextStep.state === "done" || nextStep.state === "success")
  ) {
    return "bg-emerald-500";
  }

  if (nextStep.state === "current" || nextStep.state === "error") {
    return "bg-[var(--accent)]";
  }

  return "bg-white/10";
}

function getStepBadgeLabel(state: TransactionStepState, index: number) {
  if (state === "done" || state === "success") {
    return "✓";
  }

  return String(index + 1);
}

function DetailRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: ReactNode;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-[12px] text-white/56 sm:text-[13px]">{label}</dt>
      <dd
        className={`text-right text-[12px] sm:text-[13px] ${
          emphasized ? "font-semibold text-white" : "text-white/86"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}): Promise<Metadata> {
  const [{ invoiceNumber }, siteSetting] = await Promise.all([
    params,
    getPublicSiteSetting(),
  ]);
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
    notFound();
  }

  const paymentCurrency = order.price.currency || order.variantSnapshot.currency || "IDR";
  const productImage = order.variantSnapshot.logo || order.gameSnapshot.logo;
  const transactionProgress = getTransactionProgress(order);
  const displayGameProvider = shouldHideInternalProvider(order.gameSnapshot.provider)
    ? ""
    : order.gameSnapshot.provider;

  return (
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
            </div>
          </div>

          <div className="border-b border-white/8 bg-[#24262d] px-5 py-5 sm:px-6">
            <h2 className="text-[15px] font-semibold text-white">
              Progress Transaksi
            </h2>

            <div className="mt-5 hidden gap-0 md:flex">
              {transactionProgress.map((step, index) => (
                <div key={step.title} className="flex min-w-0 flex-1 items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold transition ${getStepCircleClassName(step.state)}`}
                      >
                        {getStepBadgeLabel(step.state, index)}
                      </div>
                      {index < transactionProgress.length - 1 ? (
                        <div
                          className={`ml-3 h-[3px] flex-1 rounded-full ${getConnectorClassName(
                            step,
                            transactionProgress[index + 1]
                          )}`}
                        />
                      ) : null}
                    </div>
                    <div className="pr-4 pt-5">
                      <h3
                        className={`text-[14px] font-semibold ${getStepTextClassName(step.state)}`}
                      >
                        {step.title}
                      </h3>
                      <p
                        className={`mt-1 text-[12px] leading-5 ${getStepDescriptionClassName(step.state)}`}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 md:hidden">
              <div className="grid grid-cols-4 gap-x-2">
                {transactionProgress.map((step, index) => (
                  <div key={step.title} className="relative min-w-0">
                    {index < transactionProgress.length - 1 ? (
                      <div
                        className={`absolute left-[calc(50%+14px)] right-[-12px] top-[14px] h-[3px] rounded-full ${getConnectorClassName(
                          step,
                          transactionProgress[index + 1]
                        )}`}
                      />
                    ) : null}

                    <div className="relative flex justify-center">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition ${getStepCircleClassName(step.state)}`}
                      >
                        {getStepBadgeLabel(step.state, index)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 px-5 py-5 sm:px-6 md:grid-cols-[minmax(0,1.55fr)_minmax(290px,0.95fr)]">
            <section className="space-y-4 rounded-[20px] border border-white/8 bg-[#24262d] p-4 sm:p-5">
              <p className="text-[12px] font-medium text-white/54">
                {formatDateTime(order.createdAt)}
              </p>

              <div className="flex items-start gap-4">
                <div className="overflow-hidden rounded-[18px] border border-white/8 bg-[#31333b] shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
                  {productImage ? (
                    <Image
                      src={productImage}
                      alt={order.variantSnapshot.name || order.gameSnapshot.name}
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
                    {displayGameProvider
                      ? ` • ${displayGameProvider}`
                      : ""}
                  </p>
                </div>
              </div>

              <dl className="divide-y divide-white/8">
                <DetailRow
                  label="Harga"
                  value={formatCurrency(order.price.sellPrice, paymentCurrency)}
                />
                <DetailRow
                  label="Biaya Pembayaran"
                  value={formatCurrency(order.price.paymentFee, paymentCurrency)}
                />
                <DetailRow
                  label="Metode Pembayaran"
                  value={order.paymentMethodName || "-"}
                />
                <DetailRow
                  label="Total Pembayaran"
                  value={formatCurrency(order.price.totalAmount, paymentCurrency)}
                  emphasized
                />
              </dl>

              <section className="rounded-[18px] border border-white/8 bg-[#2b2e35] p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-[14px] font-semibold text-white">
                      Pembayaran
                    </h3>
                    <p className="mt-1 text-[12px] leading-5 text-white/56 sm:text-[13px]">
                      Area ini kita siapkan untuk QR code, link e-wallet,
                      virtual account, atau instruksi pembayaran lainnya.
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/74">
                    {order.paymentMethodName || "Metode Pembayaran"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(180px,0.8fr)]">
                  <div className="rounded-[16px] border border-dashed border-white/10 bg-[#24262d] px-4 py-5 text-center">
                    <div className="mx-auto flex h-28 w-full max-w-[240px] items-center justify-center rounded-[16px] border border-white/8 bg-[linear-gradient(135deg,#20232a_0%,#171a21_100%)] text-[12px] font-medium text-white/40">
                      QR / Link Pembayaran
                    </div>
                    <p className="mt-3 text-[12px] text-white/46">
                      Konten pembayaran akan muncul di sini setelah payment
                      gateway dihubungkan.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-[16px] border border-white/8 bg-[#24262d] px-4 py-3.5">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">
                        Metode
                      </p>
                      <p className="mt-1 text-[13px] font-medium text-white/88">
                        {order.paymentMethodName || "-"}
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
                  </div>
                </div>
              </section>
            </section>
            <aside className="hidden md:block" aria-hidden="true">
              <div className="min-h-full rounded-[20px] border border-transparent" />
            </aside>
          </div>
        </section>

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
  );
}
