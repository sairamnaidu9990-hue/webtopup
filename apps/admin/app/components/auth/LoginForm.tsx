"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login gagal");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          placeholder="admin@webtopup.com"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          placeholder="Masukkan password"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-black py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Loading..." : "Login"}
      </button>
    </form>
  );
}