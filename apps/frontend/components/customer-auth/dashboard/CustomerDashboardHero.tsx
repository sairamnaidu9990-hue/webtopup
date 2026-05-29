import Image from "next/image";

import type { StorefrontCustomer } from "@/components/customer-auth/CustomerSessionProvider";

import { formatCurrency } from "./utils";

export default function CustomerDashboardHero({
  customer,
  balanceLogoUrl,
  successfulOrders,
  totalSpent,
  totalTopupCredits,
  referredCustomersCount,
}: {
  customer: StorefrontCustomer;
  balanceLogoUrl: string;
  successfulOrders: number;
  totalSpent: number;
  totalTopupCredits: number;
  referredCustomersCount: number;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,rgba(211,59,59,0.18)_0%,rgba(17,18,23,0.96)_24%,rgba(17,18,23,0.98)_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
      <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:px-10 lg:py-10">
        <div>
          <div className="inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-200">
            Dashboard User
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Halo, {customer.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/66 sm:text-[15px]">
            Selamat datang di dashboard user KITAGG!
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                Username
              </p>
              <p className="mt-3 text-lg font-semibold text-white">@{customer.username}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4">
              <div className="flex items-center gap-3">
                {balanceLogoUrl ? (
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-white p-1 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                    <Image
                      src={balanceLogoUrl}
                      alt="Logo Saldo KITAGG"
                      width={36}
                      height={36}
                      sizes="36px"
                      className="h-9 w-9 object-contain"
                    />
                  </div>
                ) : null}
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                  Saldo KITAGG
                </p>
              </div>
              <p className="mt-3 text-lg font-semibold text-red-200">
                {formatCurrency(customer.balance)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                Order Berhasil
              </p>
              <p className="mt-3 text-lg font-semibold text-white">{successfulOrders}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                Total Belanja
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                Loyalty Points
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                {Number(customer.loyaltyPoints || 0).toLocaleString("id-ID")} poin
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
                Kode Referral
              </p>
              <p className="mt-3 text-lg font-semibold tracking-[0.12em] text-white">
                {customer.referralCode || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            Profil User
          </p>
          <div className="mt-5 space-y-4 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-white/42">Nama</p>
              <p className="mt-2 font-medium text-white">{customer.name}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-white/42">Email</p>
              <p className="mt-2 font-medium text-white">{customer.email}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-white/42">No. HP</p>
              <p className="mt-2 font-medium text-white">
                {customer.phoneCountryCode} {customer.phoneNumber}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-white/42">Total Saldo Masuk</p>
              <p className="mt-2 font-medium text-red-100">
                {formatCurrency(totalTopupCredits)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-white/42">Referral Aktif</p>
              <p className="mt-2 font-medium text-white">
                {Number(referredCustomersCount || 0).toLocaleString("id-ID")} user
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
