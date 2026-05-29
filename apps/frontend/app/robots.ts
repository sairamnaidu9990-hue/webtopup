import type { MetadataRoute } from "next";

import { getPublicSiteSetting } from "@/lib/siteData";
import { getAbsoluteSiteUrl } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteSetting = await getPublicSiteSetting();
  const homeUrl = getAbsoluteSiteUrl(siteSetting.siteDomain, "/");
  const sitemapUrl = homeUrl ? `${homeUrl.replace(/\/$/, "")}/sitemap.xml` : undefined;

  if (siteSetting.maintenanceModeEnabled) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      ...(sitemapUrl ? { sitemap: sitemapUrl } : {}),
      ...(homeUrl ? { host: homeUrl } : {}),
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    ...(sitemapUrl ? { sitemap: sitemapUrl } : {}),
    ...(homeUrl ? { host: homeUrl } : {}),
  };
}
