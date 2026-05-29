import Link from "next/link";
import Image from "next/image";
import type { PublicSiteSetting } from "@/lib/siteData";
import { SITE_INFO_PAGES } from "@/lib/site-info-pages";

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getLinkProps(url: string) {
  return /^https?:\/\//i.test(url)
    ? {
        target: "_blank",
        rel: "noreferrer",
      }
    : {};
}

function getSocialBadge(label: string) {
  const normalized = label.trim().toLowerCase();

  if (normalized.includes("instagram")) return "IG";
  if (normalized.includes("telegram")) return "TG";
  if (normalized.includes("facebook")) return "FB";
  if (normalized.includes("line")) return "LN";
  if (normalized.includes("gmail") || normalized.includes("email")) return "@";

  return (
    label
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "SO"
  );
}

function SocialLinkIcon({
  label,
  iconUrl,
}: {
  label: string;
  iconUrl?: string;
}) {
  if (iconUrl) {
    return (
      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-white/10">
        <Image
          src={iconUrl}
          alt={label}
          width={22}
          height={22}
          sizes="32px"
          className="h-[22px] w-[22px] object-contain"
        />
      </span>
    );
  }

  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-glow)] text-[11px] font-semibold text-[var(--accent-soft)]">
      {getSocialBadge(label)}
    </span>
  );
}

export default function SiteFooter({
  siteSetting,
}: {
  siteSetting: PublicSiteSetting;
}) {
  const socialLinks = siteSetting.footerSocialLinks || [];
  const footerColumns = siteSetting.footerLinkColumns || [];
  const footerBottomText =
    siteSetting.footerBottomText ||
    `© ${new Date().getFullYear()} ${siteSetting.siteName}. All rights reserved.`;

  return (
    <footer className="mt-14 bg-[#1a1c22]">
      <div className="site-shell py-10 sm:py-12 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] lg:gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              {siteSetting.siteFaviconUrl ? (
                <Image
                  src={siteSetting.siteFaviconUrl}
                  alt={siteSetting.siteName}
                  width={48}
                  height={48}
                  sizes="48px"
                  className="h-12 w-12 rounded-2xl object-contain ring-1 ring-white/10"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-base font-semibold tracking-[0.16em] text-white ring-1 ring-white/10">
                  {getInitials(siteSetting.siteName || "WT") || "WT"}
                </div>
              )}

              <div>
                <p className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-white">
                  {siteSetting.siteName}
                </p>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-8 text-white/78 sm:text-base">
              {siteSetting.footerDescription || siteSetting.siteDescription}
            </p>

            {socialLinks.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((item, index) => (
                  <a
                    key={`${item.label}-${index}`}
                    href={item.url || "#"}
                    {...getLinkProps(item.url)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:border-[#d33b3b] hover:bg-white/8"
                  >
                    <SocialLinkIcon
                      label={item.label}
                      iconUrl={item.iconUrl}
                    />
                    <span>{item.label}</span>
                  </a>
                ))}
              </div>
            ) : null}

            <div className="space-y-3">
              <p className="text-base font-semibold text-[var(--accent-soft)]">
                Informasi
              </p>
              <div className="space-y-2.5">
                {SITE_INFO_PAGES.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="block text-sm text-white/82 transition hover:text-white"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {footerColumns.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {footerColumns.map((column, columnIndex) => (
                <div key={`${column.title}-${columnIndex}`} className="space-y-4">
                  <p className="text-base font-semibold text-[var(--accent-soft)]">
                    {column.title}
                  </p>

                  <div className="space-y-3">
                    {column.links.map((link, linkIndex) => (
                      <a
                        key={`${link.label}-${linkIndex}`}
                        href={link.url || "#"}
                        {...getLinkProps(link.url)}
                        className="block text-sm text-white/82 transition hover:text-white"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-10 border-t border-white/8 pt-6">
          <p className="text-sm text-white/72">{footerBottomText}</p>
        </div>
      </div>
    </footer>
  );
}
