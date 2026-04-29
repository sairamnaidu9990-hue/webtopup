import type { Metadata } from "next";

import SiteInfoPageContent from "@/components/SiteInfoPageContent";
import { getPublicSiteSetting } from "@/lib/siteData";

export async function generateMetadata(): Promise<Metadata> {
  const siteSetting = await getPublicSiteSetting();

  return {
    title: `Kebijakan Pribadi | ${siteSetting.siteName}`,
    description:
      siteSetting.privacyPolicyContent ||
      `Kebijakan pribadi ${siteSetting.siteName}.`,
  };
}

export default async function KebijakanPribadiPage() {
  const siteSetting = await getPublicSiteSetting();

  return (
    <SiteInfoPageContent
      siteSetting={siteSetting}
      currentKey="privacyPolicyContent"
    />
  );
}
