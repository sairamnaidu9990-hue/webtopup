"use client";

import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

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
    <div className="min-h-screen bg-[#eef2f6]">
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
          <main className="flex-1 p-6">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
