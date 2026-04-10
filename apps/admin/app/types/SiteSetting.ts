export type SiteBanner = {
  title: string;
  imageUrl: string;
};

export type SiteSetting = {
  siteName: string;
  siteLogoUrl: string;
  siteFaviconUrl: string;
  siteDomain: string;
  siteTitle: string;
  siteDescription: string;
  bannerCount: number;
  bannerAutoSlideSeconds: number;
  banners: SiteBanner[];
  updatedAt?: string | null;
};
