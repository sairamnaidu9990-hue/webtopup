"use client";

import LogoutButton from "../../components/auth/LogoutButton";

type HeaderProps = {
  adminEmail?: string;
  onMenuClick?: () => void;
};

export default function Header({ adminEmail, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[79px] items-center justify-between border-b border-white/10 bg-[#1a0d0d]/90 px-6 backdrop-blur">
      
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
          <h2 className="text-sm font-semibold text-white">
            Dashboard
          </h2>
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