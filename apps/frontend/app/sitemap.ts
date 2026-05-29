import type { MetadataRoute } from "next";

import { getPublicArticles, getPublicSiteSetting } from "@/lib/siteData";
import { getAbsoluteSiteUrl } from "@/lib/seo";

async function getAllPublishedArticles() {
  const firstPage = await getPublicArticles({
    page: 1,
    limit: 100,
  });
  const items = [...firstPage.items];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const nextPage = await getPublicArticles({
      page,
      limit: 100,
    });

    items.push(...nextPage.items);
  }

  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteSetting = await getPublicSiteSetting();
  const homeUrl = getAbsoluteSiteUrl(siteSetting.siteDomain, "/");

  if (!homeUrl) {
    return [];
  }

  const articles = await getAllPublishedArticles();

  return [
    {
      url: homeUrl,
      lastModified: siteSetting.updatedAt || new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: getAbsoluteSiteUrl(siteSetting.siteDomain, "/artikel") || `${homeUrl}artikel`,
      lastModified: siteSetting.updatedAt || new Date().toISOString(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    ...articles.map((article) => ({
      url:
        getAbsoluteSiteUrl(siteSetting.siteDomain, `/artikel/${article.slug}`) ||
        `${homeUrl}artikel/${article.slug}`,
      lastModified:
        article.updatedAt || article.publishedAt || article.createdAt || new Date().toISOString(),
      changeFrequency: "weekly" as const,
      priority: article.isFeatured ? 0.8 : 0.7,
    })),
  ];
}
