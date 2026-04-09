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
    if (pathname.startsWith("/provider-control/bangjeff")) {
      return "BangJeff";
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

    return "Dashboard";
  })();

  return (
    <header className="sticky top-0 z-30 flex h-[79px] items-center justify-between border-b border-[#2a1f1f] bg-[#231919] px-6">
      
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white lg:hidden"
        >
          ☰
        </button>

        <div>
          <h2 className="text-sm font-semibold text-white">{pageTitle}</h2>
          <p className="text-xs text-gray-400">
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
