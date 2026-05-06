"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCustomerSession } from "./CustomerSessionProvider";
import CustomerAuthPageShell from "./CustomerAuthPageShell";

export default function CustomerLoginPageClient() {
  const router = useRouter();
  const { refresh } = useCustomerSession();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch("/api/customer-auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login,
          password,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Login gagal");
      }

      await refresh();
      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login gagal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomerAuthPageShell
      title="Masuk ke akunmu"
      subtitle="Login opsional. Kamu tetap bisa beli dan cek transaksi tanpa akun, tapi akun akan memudahkan melihat riwayat transaksi dan saldo KITAGG."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={login}
          onChange={(event) => setLogin(event.target.value)}
          placeholder="Username atau email"
          className="w-full rounded-2xl border border-white/10 bg-[#23262f] px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-red-300 focus:ring-4 focus:ring-red-500/10 md:text-sm"
          required
        />

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded-2xl border border-white/10 bg-[#23262f] px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-red-300 focus:ring-4 focus:ring-red-500/10 md:text-sm"
          required
        />

        {error ? (
          <div className="rounded-2xl border border-red-200/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(211,59,59,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <p className="mt-5 text-sm text-white/60">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-semibold text-red-300 hover:text-red-200">
          Daftar sekarang
        </Link>
      </p>
    </CustomerAuthPageShell>
  );
}
