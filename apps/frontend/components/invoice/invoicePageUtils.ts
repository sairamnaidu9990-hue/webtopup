import type { StorefrontOrder } from "@/lib/siteData";

export function formatCurrency(value: number, currency: string) {
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

export function formatDateTime(value?: string) {
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

export function extractInstructionLines(value?: string) {
  return String(value || "")
    .replace(/<\/p>\s*<p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getStatusLabel(status: string) {
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

export function shouldAutoRefreshOrder(order: StorefrontOrder) {
  const orderStatus = String(order.status || "").trim().toUpperCase();
  const paymentStatus = String(order.paymentStatus || "").trim().toUpperCase();
  const providerStatus = String(order.providerStatus || "").trim().toUpperCase();

  if (["SUCCESS", "FAILED", "REFUNDED", "EXPIRED"].includes(orderStatus)) {
    return false;
  }

  if (["FAILED", "REFUNDED", "EXPIRED"].includes(paymentStatus)) {
    return false;
  }

  if (["SUCCESS", "FAILED"].includes(providerStatus)) {
    return false;
  }

  return true;
}

export function shouldHideInternalProvider(value?: string) {
  return String(value || "").trim().toLowerCase().includes("bangjeff");
}

export type TransactionStepState =
  | "done"
  | "current"
  | "upcoming"
  | "error"
  | "success";

export type TransactionStep = {
  title: string;
  description: string;
  state: TransactionStepState;
};

export function getTransactionProgress(order: StorefrontOrder): TransactionStep[] {
  const orderStatus = String(order.status || "").trim().toUpperCase();
  const paymentStatus = String(order.paymentStatus || "").trim().toUpperCase();
  const providerStatus = String(order.providerStatus || "").trim().toUpperCase();

  const paymentStep: TransactionStep = {
    title: "Pembayaran",
    description: "Menunggu pembayaran dari kamu.",
    state: "current",
  };

  const processStep: TransactionStep = {
    title: "Sedang Di Proses",
    description: "Pembelian sedang dalam proses.",
    state: "upcoming",
  };

  const completedStep: TransactionStep = {
    title: "Transaksi Selesai",
    description: "Transaksi akan selesai setelah proses provider berhasil.",
    state: "upcoming",
  };

  if (paymentStatus === "EXPIRED") {
    paymentStep.description = "Pembayaran telah kedaluwarsa.";
    paymentStep.state = "error";
    processStep.state = "upcoming";
    processStep.description = "Menunggu pembayaran berhasil.";
  } else if (paymentStatus === "FAILED") {
    paymentStep.description = "Pembayaran gagal diproses.";
    paymentStep.state = "error";
    processStep.state = "upcoming";
    processStep.description = "Menunggu pembayaran berhasil.";
  } else if (paymentStatus === "REFUNDED") {
    paymentStep.description = "Pembayaran telah direfund.";
    paymentStep.state = "done";
    processStep.state = "upcoming";
    processStep.description = "Transaksi tidak dilanjutkan setelah refund.";
    completedStep.state = "error";
    completedStep.description = "Transaksi telah direfund.";
  } else if (paymentStatus === "PAID") {
    paymentStep.description = "Pembayaran telah berhasil diterima.";
    paymentStep.state = "done";
    processStep.state = "current";
    processStep.description = "Pembelian sedang dalam proses.";

    if (orderStatus === "SUCCESS" || providerStatus === "SUCCESS") {
      processStep.description = "Pembelian telah selesai diproses.";
      processStep.state = "done";
      completedStep.description = "Transaksi telah berhasil dilakukan.";
      completedStep.state = "success";
    } else if (orderStatus === "FAILED" || providerStatus === "FAILED") {
      processStep.description = "Pesanan gagal diproses oleh provider.";
      processStep.state = "error";
      completedStep.description =
        "Transaksi belum dapat diselesaikan karena proses provider gagal.";
    }
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

export function getStepCircleClassName(state: TransactionStepState) {
  switch (state) {
    case "done":
      return "border-emerald-400 bg-emerald-500 text-white shadow-[0_0_0_6px_rgba(34,197,94,0.14)]";
    case "success":
      return "border-emerald-400 bg-[#2a2d33] text-white shadow-[0_0_0_6px_rgba(34,197,94,0.14)]";
    case "current":
    case "error":
      return "border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_0_0_6px_var(--accent-glow)]";
    default:
      return "border-white/12 bg-[#23262d] text-white/54";
  }
}

export function getStepTextClassName(state: TransactionStepState) {
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

export function getStepDescriptionClassName(state: TransactionStepState) {
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

export function getConnectorClassName(
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

export function getStepBadgeLabel(state: TransactionStepState, index: number) {
  if (state === "done" || state === "success") {
    return "✓";
  }

  return String(index + 1);
}
