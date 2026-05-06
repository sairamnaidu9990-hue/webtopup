"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCustomerSession } from "./CustomerSessionProvider";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export default function CustomerAuthActions({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { customer, loading, logout } = useCustomerSession();

  const handleLogout = async () => {
    await logout();
    onNavigate?.();
    router.refresh();
    router.push("/");
  };

  if (loading) {
    return mobile ? (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
        Memuat akun...
      </div>
    ) : (
      <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
        Memuat akun...
      </div>
    );
  }

  if (!customer) {
    if (mobile) {
      return (
        <div className="space-y-2">
          <Link
            href="/masuk"
            onClick={onNavigate}
            className="block rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/88 transition hover:bg-white/5 hover:text-white"
          >
            Masuk
          </Link>
          <Link
            href="/daftar"
            onClick={onNavigate}
            className="block rounded-2xl bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(211,59,59,0.2)] transition hover:brightness-110"
          >
            Daftar
          </Link>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Link
          href="/masuk"
          className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
        >
          Masuk
        </Link>
        <Link
          href="/daftar"
          className="rounded-full bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(211,59,59,0.2)] transition hover:brightness-110"
        >
          Daftar
        </Link>
      </div>
    );
  }

  if (mobile) {
    return (
      <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div>
          <p className="text-sm font-semibold text-white">{customer.name}</p>
          <p className="mt-1 text-xs text-white/60">@{customer.username}</p>
          <p className="mt-1 text-xs text-white/60">{customer.email}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-300">
            Saldo {formatCurrency(customer.balance)}
          </p>
        </div>
        <div className="space-y-2">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="block rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/88 transition hover:bg-white/5 hover:text-white"
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="block w-full rounded-2xl bg-[#2a2d34] px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-[#343842]"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/dashboard"
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 transition hover:bg-white/10"
      >
        <span className="font-semibold">{customer.name}</span>
        <span className="ml-2 text-white/55">Saldo {formatCurrency(customer.balance)}</span>
      </Link>
      <button
        type="button"
        onClick={() => void handleLogout()}
        className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
      >
        Logout
      </button>
    </div>
  );
}
