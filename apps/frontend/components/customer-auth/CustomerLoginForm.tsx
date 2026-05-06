"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CustomerAuthLayout from "@/components/customer-auth/CustomerAuthLayout";
import { useCustomerSession } from "@/components/customer-auth/CustomerSessionProvider";

export default function CustomerLoginForm() {
  const router = useRouter();
  const { customer, loading, refresh } = useCustomerSession();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && customer) {
      router.replace("/dashboard");
    }
  }, [customer, loading, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
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
      const payload = await response.json().catch(() => ({
        message: "Respons login tidak valid",
      }));

      if (!response.ok) {
        throw new Error(payload.message || "Login gagal");
      }

      await refresh();
      router.refresh();
      router.push("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Login gagal"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomerAuthLayout
      title="Masuk"
      subtitle="Masuk dengan akun yang telah Kamu daftarkan."
      alternateHref="/daftar"
      alternateLabel="Daftar sekarang"
      alternateText="Belum punya akun?"
      eyebrow=""
      showFeatureCards={false}
      showAlternateNotice={false}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/84">
            Username atau Email
          </label>
          <input
            type="text"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            placeholder="Masukkan username atau email"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-red-400/40 focus:bg-white/[0.08]"
            autoComplete="username"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/84">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Masukkan password"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-red-400/40 focus:bg-white/[0.08]"
            autoComplete="current-password"
            required
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(211,59,59,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-65"
        >
          {submitting ? "Memproses..." : "Masuk"}
        </button>
      </form>

    </CustomerAuthLayout>
  );
}
