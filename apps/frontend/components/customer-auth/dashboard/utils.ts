import type { StorefrontBalanceTransaction } from "@/lib/siteData";

export const MIN_TOPUP_AMOUNT = 1000;
export const MAX_TOPUP_AMOUNT = 10000000;

export function formatCurrency(value: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function getStatusTone(status?: string) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "SUCCESS" || normalized === "PAID") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  if (normalized === "FAILED" || normalized === "EXPIRED") {
    return "border-red-400/20 bg-red-500/10 text-red-100";
  }

  if (normalized === "PROCESSING") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-100";
  }

  return "border-white/10 bg-white/5 text-white/70";
}

export function getTransactionTone(transaction: StorefrontBalanceTransaction) {
  return transaction.type === "CREDIT"
    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
    : "border-red-400/20 bg-red-500/10 text-red-100";
}

export function getTransactionLabel(transaction: StorefrontBalanceTransaction) {
  const source = String(transaction.source || "").toUpperCase();

  if (source === "BALANCE_TOPUP") {
    return "Topup Saldo";
  }

  if (source === "ORDER_PAYMENT") {
    return "Pembayaran dengan Saldo";
  }

  if (source === "ADMIN_CREDIT") {
    return "Isi Saldo Manual Admin";
  }

  if (source === "ADMIN_DEBIT") {
    return "Pengurangan Saldo Admin";
  }

  if (source === "REFERRAL_WELCOME_BONUS") {
    return "Bonus Referral User Baru";
  }

  if (source === "REFERRAL_REFERRER_BONUS") {
    return "Bonus Referral Pengajak";
  }

  if (source === "LOYALTY_REDEEM_BALANCE") {
    return "Tukar Poin ke Saldo";
  }

  return transaction.type === "CREDIT" ? "Saldo Masuk" : "Saldo Keluar";
}
