import type { PublicSiteSetting } from "@/lib/siteData";

export const SITE_INFO_PAGES = [
  {
    key: "legalityContent",
    href: "/legalitas",
    title: "Legalitas",
  },
  {
    key: "privacyPolicyContent",
    href: "/kebijakan-pribadi",
    title: "Kebijakan Pribadi",
  },
  {
    key: "termsConditionsContent",
    href: "/syarat-ketentuan",
    title: "Syarat & Ketentuan",
  },
] as const;

export type SiteInfoPageKey = (typeof SITE_INFO_PAGES)[number]["key"];

export function getSiteInfoPageContent(
  siteSetting: PublicSiteSetting,
  key: SiteInfoPageKey
) {
  return String(siteSetting[key] || "").trim();
}
