"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CustomerAuthLayout from "@/components/customer-auth/CustomerAuthLayout";
import { useCustomerSession } from "@/components/customer-auth/CustomerSessionProvider";

const defaultForm = {
  username: "",
  name: "",
  email: "",
  phoneCountryCode: "+62",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
};

export default function CustomerRegisterForm() {
  const router = useRouter();
  const { customer, loading, refresh } = useCustomerSession();
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && customer) {
      router.replace("/");
    }
  }, [customer, loading, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
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
      const payload = await response.json().catch(() => ({
        message: "Respons pendaftaran tidak valid",
      }));

      if (!response.ok) {
        throw new Error(payload.message || "Pendaftaran gagal");
      }

      await refresh();
      router.refresh();
      router.push("/");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Pendaftaran gagal"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomerAuthLayout
      title="Daftar"
      subtitle="Masukkan informasi pendaftaran yang valid."
      alternateHref="/masuk"
      alternateLabel="Masuk di sini"
      alternateText="Sudah punya akun?"
      eyebrow=""
      showFeatureCards={false}
      showAlternateNotice
    >
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-white/84">
            Username
          </label>
          <input
            type="text"
            value={form.username}
            onChange={(event) =>
              setForm((current) => ({ ...current, username: event.target.value }))
            }
            placeholder="Contoh: kitagg123"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-red-400/40 focus:bg-white/[0.08]"
            autoComplete="username"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-white/84">
            Nama Lengkap
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Nama lengkap"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-red-400/40 focus:bg-white/[0.08]"
            autoComplete="name"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-white/84">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="nama@email.com"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-red-400/40 focus:bg-white/[0.08]"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/84">
            Kode Negara
          </label>
          <input
            type="text"
            value={form.phoneCountryCode}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                phoneCountryCode: event.target.value,
              }))
            }
            placeholder="+62"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-red-400/40 focus:bg-white/[0.08]"
            autoComplete="tel-country-code"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/84">
            No. HP
          </label>
          <input
            type="tel"
            value={form.phoneNumber}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                phoneNumber: event.target.value,
              }))
            }
            placeholder="81234567890"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-red-400/40 focus:bg-white/[0.08]"
            autoComplete="tel"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/84">
            Password
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            placeholder="Minimal 8 karakter"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-red-400/40 focus:bg-white/[0.08]"
            autoComplete="new-password"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/84">
            Konfirmasi Password
          </label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                confirmPassword: event.target.value,
              }))
            }
            placeholder="Ulangi password"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-red-400/40 focus:bg-white/[0.08]"
            autoComplete="new-password"
            required
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100 md:col-span-2">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(211,59,59,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-65 md:col-span-2"
        >
          {submitting ? "Membuat akun..." : "Daftar Sekarang"}
        </button>
      </form>
    </CustomerAuthLayout>
  );
}
