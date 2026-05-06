export type SiteBanner = {
  title: string;
  imageUrl: string;
};

export type SiteFooterLink = {
  label: string;
  url: string;
};

export type SiteFooterColumn = {
  title: string;
  links: SiteFooterLink[];
};

export type SiteCategoryDescription = {
  category: string;
  description: string;
};

export type SiteGameFaq = {
  question: string;
  answer: string;
};

export type SiteSetting = {
  siteName: string;
  siteLogoUrl: string;
  siteFaviconUrl: string;
  kitaggBalanceLogoUrl: string;
  siteDomain: string;
  googleSiteVerification: string;
  siteTitle: string;
  siteDescription: string;
  gameCategories: string[];
  categoryDescriptions: SiteCategoryDescription[];
  gameFaqs: SiteGameFaq[];
  reviewCommentsVisible: boolean;
  bannerCount: number;
  bannerAutoSlideSeconds: number;
  homepagePopupEnabled: boolean;
  homepagePopupTitle: string;
  homepagePopupMessage: string;
  homepagePopupImageUrl: string;
  floatingContactEnabled: boolean;
  floatingContactLabel: string;
  floatingContactUrl: string;
  maintenanceModeEnabled: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  legalityContent: string;
  privacyPolicyContent: string;
  termsConditionsContent: string;
  banners: SiteBanner[];
  footerDescription: string;
  footerBottomText: string;
  footerSocialLinks: SiteFooterLink[];
  footerLinkColumns: SiteFooterColumn[];
  updatedAt?: string | null;
};
