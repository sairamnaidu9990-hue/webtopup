"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCustomerSession } from "./CustomerSessionProvider";
import CustomerAuthPageShell from "./CustomerAuthPageShell";

const initialForm = {
  username: "",
  name: "",
  email: "",
  phoneCountryCode: "+62",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
};

export default function CustomerRegisterPageClient() {
  const router = useRouter();
  const { refresh } = useCustomerSession();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      if (form.password !== form.confirmPassword) {
        throw new Error("Konfirmasi password tidak cocok");
      }

      const response = await fetch("/api/customer-auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.username,
          name: form.name,
          email: form.email,
          phoneCountryCode: form.phoneCountryCode,
          phoneNumber: form.phoneNumber,
          password: form.password,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Daftar gagal");
      }

      await refresh();
      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Daftar gagal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomerAuthPageShell
      title="Buat akun baru"
      subtitle="Dengan akun KITAGG, user bisa punya dashboard sendiri, lihat saldo KITAGG, dan menyimpan riwayat transaksi di satu tempat."
    >
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <input
          value={form.username}
          onChange={(event) =>
            setForm((current) => ({ ...current, username: event.target.value }))
          }
          placeholder="Username"
          className="w-full rounded-2xl border border-white/10 bg-[#23262f] px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-red-300 focus:ring-4 focus:ring-red-500/10 md:text-sm"
          required
        />

        <input
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, name: event.target.value }))
          }
          placeholder="Nama lengkap"
          className="w-full rounded-2xl border border-white/10 bg-[#23262f] px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-red-300 focus:ring-4 focus:ring-red-500/10 md:text-sm"
          required
        />

        <input
          type="email"
          value={form.email}
          onChange={(event) =>
            setForm((current) => ({ ...current, email: event.target.value }))
          }
          placeholder="Email"
          className="w-full rounded-2xl border border-white/10 bg-[#23262f] px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-red-300 focus:ring-4 focus:ring-red-500/10 md:text-sm"
          required
        />

        <div className="flex gap-3">
          <input
            value={form.phoneCountryCode}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                phoneCountryCode: event.target.value,
              }))
            }
            placeholder="+62"
            className="w-24 rounded-2xl border border-white/10 bg-[#23262f] px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-red-300 focus:ring-4 focus:ring-red-500/10 md:text-sm"
            required
          />
          <input
            value={form.phoneNumber}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                phoneNumber: event.target.value,
              }))
            }
            placeholder="Nomor HP"
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#23262f] px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-red-300 focus:ring-4 focus:ring-red-500/10 md:text-sm"
            required
          />
        </div>

        <input
          type="password"
          value={form.password}
          onChange={(event) =>
            setForm((current) => ({ ...current, password: event.target.value }))
          }
          placeholder="Password"
          className="w-full rounded-2xl border border-white/10 bg-[#23262f] px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-red-300 focus:ring-4 focus:ring-red-500/10 md:text-sm"
          required
        />

        <input
          type="password"
          value={form.confirmPassword}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              confirmPassword: event.target.value,
            }))
          }
          placeholder="Konfirmasi password"
          className="w-full rounded-2xl border border-white/10 bg-[#23262f] px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-red-300 focus:ring-4 focus:ring-red-500/10 md:text-sm"
          required
        />

        {error ? (
          <div className="rounded-2xl border border-red-200/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 md:col-span-2">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(211,59,59,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
        >
          {submitting ? "Memproses..." : "Daftar"}
        </button>
      </form>

      <p className="mt-5 text-sm text-white/60">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-semibold text-red-300 hover:text-red-200">
          Masuk di sini
        </Link>
      </p>
    </CustomerAuthPageShell>
  );
}
