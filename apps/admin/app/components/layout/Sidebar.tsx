"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

const providerItems = [
  { label: "BangJeff", href: "/provider-control/bangjeff" },
  { label: "Markup Variant", href: "/provider-control/bangjeff/markup" },
];

const primaryItems = [{ label: "Dashboard", href: "/dashboard" }];

const menuItems = [
  { label: "Games", href: "/games" },
  { label: "Variants", href: "/variants" },
  { label: "Orders", href: "/orders" },
];

const desktopSidebarStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  height: "100vh",
  contain: "layout paint",
  transform: "translateZ(0)",
  backfaceVisibility: "hidden",
};

type SidebarNavProps = {
  onNavigate?: () => void;
  pathname: string;
  providerOpen: boolean;
  setProviderOpen: Dispatch<SetStateAction<boolean>>;
  isProviderRoute: boolean;
};

function SidebarNav({
  onNavigate,
  pathname,
  providerOpen,
  setProviderOpen,
  isProviderRoute,
}: SidebarNavProps) {
  return (
    <>
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex min-h-[72px] flex-col justify-center border-b border-white/10 px-5 py-4 transition hover:bg-[#171a22] sm:min-h-[79px] sm:px-6"
      >
        <h1 className="text-lg font-semibold tracking-tight">WebTopup</h1>
        <p className="mt-1 text-xs text-gray-400">Admin Panel</p>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-5 sm:px-4 sm:py-6">
        <ul className="space-y-2">
          {primaryItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#2a2d37] text-white"
                      : "text-gray-400 hover:bg-[#1a1d27] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}

          <li>
            <button
              type="button"
              onClick={() => setProviderOpen((current) => !current)}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isProviderRoute || providerOpen
                  ? "bg-[#2a2d37] text-white"
                  : "text-gray-400 hover:bg-[#1a1d27] hover:text-white"
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
                      onClick={onNavigate}
                      className={`flex items-center rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 ${
                        isActive
                          ? "border-[#343847] bg-[#252833] text-white"
                          : "border-transparent text-gray-400 hover:border-[#2c3140] hover:bg-[#1a1d27] hover:text-white"
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
                  onClick={onNavigate}
                  className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#2a2d37] text-white"
                      : "text-gray-400 hover:bg-[#1a1d27] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

export default function Sidebar({
  mobileOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const isProviderRoute =
    pathname === "/provider-control" || pathname.startsWith("/provider-control/");
  const [providerOpen, setProviderOpen] = useState(isProviderRoute);

  useEffect(() => {
    if (isProviderRoute) {
      setProviderOpen(true);
    }
  }, [isProviderRoute]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[84vw] max-w-[280px] flex-col border-r border-white/5 bg-[#111217] text-white transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarNav
          onNavigate={onClose}
          pathname={pathname}
          providerOpen={providerOpen}
          setProviderOpen={setProviderOpen}
          isProviderRoute={isProviderRoute}
        />
      </aside>

      <aside
        className="hidden w-64 shrink-0 self-start border-r border-white/5 bg-[#111217] text-white lg:flex lg:flex-col"
        style={desktopSidebarStyle}
      >
        <SidebarNav
          pathname={pathname}
          providerOpen={providerOpen}
          setProviderOpen={setProviderOpen}
          isProviderRoute={isProviderRoute}
        />
      </aside>
    </>
  );
}
