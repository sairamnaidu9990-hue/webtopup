"use client";

import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import AdminSessionManager from "../components/auth/AdminSessionManager";

type DashboardShellProps = {
  adminEmail?: string;
  children: React.ReactNode;
};

export default function DashboardShell({
  adminEmail,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#eef2f6] text-[#0f172a]">
      <AdminSessionManager />
      <div className="flex min-h-screen items-stretch">
        <Sidebar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Header
            adminEmail={adminEmail}
            onMenuClick={() => setMobileOpen(true)}
          />
          <main className="flex-1 px-3 py-3 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
