"use client";

import { usePathname } from "next/navigation";
import LogoutButton from "../../components/auth/LogoutButton";

type HeaderProps = {
  adminEmail?: string;
  onMenuClick?: () => void;
};

export default function Header({ adminEmail, onMenuClick }: HeaderProps) {
  const pathname = usePathname();

  const pageTitle = (() => {
    if (pathname === "/provider-control") {
      return "Provider Control";
    }

    if (pathname.startsWith("/provider-control/bangjeff/games")) {
      return "BangJeff Games";
    }

    if (pathname.startsWith("/provider-control/bangjeff/sync-logs")) {
      return "BangJeff Sync Logs";
    }

    if (pathname.startsWith("/provider-control/bangjeff/variants")) {
      return "BangJeff Variants";
    }

    if (pathname.startsWith("/provider-control/bangjeff/markup")) {
      return "BangJeff Markup";
    }

    if (pathname.startsWith("/provider-control/bangjeff")) {
      return "BangJeff Dashboard";
    }

    if (pathname.startsWith("/provider-control/manual")) {
      if (pathname.startsWith("/provider-control/manual/games")) {
        return "Manual Games";
      }

      if (pathname.startsWith("/provider-control/manual/variants")) {
        return "Manual Variants";
      }

      if (pathname.startsWith("/provider-control/manual/markup")) {
        return "Manual Markup";
      }

      return "Manual Dashboard";
    }

    if (pathname.startsWith("/games")) {
      return "Games";
    }

    if (pathname.startsWith("/variants")) {
      return "Variants";
    }

    if (pathname.startsWith("/orders")) {
      return "Orders";
    }

    if (pathname.startsWith("/payment-methods")) {
      return "Payment Methods";
    }

    if (pathname.startsWith("/admins")) {
      return "Admin Management";
    }

    if (pathname.startsWith("/website-settings")) {
      return "Website Settings";
    }

    return "Dashboard";
  })();

  return (
    <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-4 border-b border-[#2a1f1f] bg-[#231919] px-4 py-3 sm:min-h-[79px] sm:px-6">
      
      {/* Left */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white lg:hidden"
        >
          ☰
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-white sm:text-base">
            {pageTitle}
          </h2>
          <p className="truncate text-xs text-gray-400 sm:text-sm">
            {adminEmail
              ? `Login sebagai: ${adminEmail}`
              : "Selamat datang"}
          </p>
        </div>
      </div>

      {/* Right */}
      <LogoutButton />
    </header>
  );
}
