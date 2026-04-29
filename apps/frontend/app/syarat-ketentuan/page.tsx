import type { Metadata } from "next";

import SiteInfoPageContent from "@/components/SiteInfoPageContent";
import { getPublicSiteSetting } from "@/lib/siteData";

export async function generateMetadata(): Promise<Metadata> {
  const siteSetting = await getPublicSiteSetting();

  return {
    title: `Syarat & Ketentuan | ${siteSetting.siteName}`,
    description:
      siteSetting.termsConditionsContent ||
      `Syarat dan ketentuan ${siteSetting.siteName}.`,
  };
}

export default async function SyaratKetentuanPage() {
  const siteSetting = await getPublicSiteSetting();

  return (
    <SiteInfoPageContent
      siteSetting={siteSetting}
      currentKey="termsConditionsContent"
    />
  );
}
