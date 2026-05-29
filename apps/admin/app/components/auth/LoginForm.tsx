"use client";

import { useState } from "react";
import { broadcastAdminActivity } from "@/lib/adminSession";

type LoginFormProps = {
  sessionExpired?: boolean;
};

export default function LoginForm({
  sessionExpired = false,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login gagal");
      }

      broadcastAdminActivity();
      window.location.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {sessionExpired && !error && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Sesi admin berakhir karena tidak ada aktivitas. Silakan login kembali.
        </div>
      )}
      
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Email */}
      <div>
        <label className="mb-2 block text-sm text-gray-300">
          Email Admin
        </label>
        <input
          type="email"
          placeholder="admin@webtopup.com"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {/* Password */}
      <div>
        <label className="mb-2 block text-sm text-gray-300">
          Kata Sandi
        </label>
        <input
          type="password"
          placeholder="Masukkan kata sandi"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {/* Button */}
      <button
        type="submit"
        className="w-full rounded-xl bg-white py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
