"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { broadcastAdminLogout } from "@/lib/adminSession";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      broadcastAdminLogout();

      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded-xl bg-black px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-60 sm:px-4 sm:text-sm"
    >
      {loading ? "Memproses..." : "Keluar"}
    </button>
  );
}
