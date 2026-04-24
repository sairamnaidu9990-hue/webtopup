import type { PublicSiteSetting } from "@/lib/siteData";

function HeadsetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path d="M4 13a8 8 0 1 1 16 0" />
      <path d="M5.5 13.5A1.5 1.5 0 0 1 7 12h1a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H7a1.5 1.5 0 0 1-1.5-1.5v-4Z" />
      <path d="M15 13a1 1 0 0 1 1-1h1a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 17 19h-1a1 1 0 0 1-1-1v-5Z" />
      <path d="M9 19a3 3 0 0 0 3 3h1.5" />
    </svg>
  );
}

export default function FloatingContactButton({
  siteSetting,
}: {
  siteSetting: PublicSiteSetting;
}) {
  const buttonUrl = String(siteSetting.floatingContactUrl || "").trim();

  if (!siteSetting.floatingContactEnabled || !buttonUrl) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed z-40"
      style={{
        right: "max(1rem, env(safe-area-inset-right, 0px))",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
      }}
    >
      <a
        href={buttonUrl}
        aria-label={siteSetting.floatingContactLabel}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-[18px] border border-[rgba(226,75,75,0.42)] bg-[linear-gradient(135deg,#d33b3b_0%,#e24b4b_100%)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white shadow-[0_18px_40px_rgba(211,59,59,0.3)] transition hover:-translate-y-0.5 hover:border-[rgba(255,155,155,0.55)] hover:shadow-[0_22px_44px_rgba(211,59,59,0.36)] sm:px-4 sm:py-3"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.14)] text-white">
          <HeadsetIcon />
        </span>
        <span className="whitespace-nowrap">
          {siteSetting.floatingContactLabel}
        </span>
      </a>
    </div>
  );
}
