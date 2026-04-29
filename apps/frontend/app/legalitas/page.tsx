import type { Metadata } from "next";

import SiteInfoPageContent from "@/components/SiteInfoPageContent";
import { getPublicSiteSetting } from "@/lib/siteData";

export async function generateMetadata(): Promise<Metadata> {
  const siteSetting = await getPublicSiteSetting();

  return {
    title: `Legalitas | ${siteSetting.siteName}`,
    description:
      siteSetting.legalityContent ||
      `Informasi legalitas ${siteSetting.siteName}.`,
  };
}

export default async function LegalitasPage() {
  const siteSetting = await getPublicSiteSetting();

  return <SiteInfoPageContent siteSetting={siteSetting} currentKey="legalityContent" />;
}
