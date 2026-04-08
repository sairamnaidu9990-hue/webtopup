"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

const providerItems = [{ label: "Bangjeff", href: "/dashboard" }];

const menuItems = [
  { label: "Games", href: "/games" },
  { label: "Variants", href: "/variants" },
  { label: "Orders", href: "/orders" },
];

export default function Sidebar({
  mobileOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const [providerOpen, setProviderOpen] = useState(
    pathname === "/dashboard" || pathname.startsWith("/dashboard/")
  );
  const isProviderActive =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-[#111217] text-white transition-transform duration-300 lg:static lg:z-auto lg:h-auto lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex h-[79px] flex-col justify-center border-b border-white/10 px-6 transition hover:bg-white/5"
        >
          <h1 className="text-lg font-semibold tracking-tight">WebTopup</h1>
          <p className="mt-1 text-xs text-gray-400">Admin Panel</p>
        </Link>

        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            <li>
              <button
                type="button"
                onClick={() => setProviderOpen((current) => !current)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isProviderActive || providerOpen
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>Provider Control</span>
                <span className="text-xs text-gray-400">
                  {providerOpen ? "-" : "+"}
                </span>
              </button>

              {providerOpen ? (
                <div className="mt-2 space-y-1 pl-3">
                  {providerItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 ${
                          isActive
                            ? "border-white/10 bg-white/10 text-white"
                            : "border-transparent text-gray-400 hover:border-white/10 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </li>

            {menuItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
