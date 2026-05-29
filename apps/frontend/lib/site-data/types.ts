export type SiteBanner = {
  title: string;
  imageUrl: string;
};

export type SiteFooterLink = {
  label: string;
  url: string;
  iconUrl: string;
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

export type PublicArticleCategory =
  | "GAME"
  | "EVENT"
  | "PROMO"
  | "TOPUP_GUIDE";

export type PublicArticleGameReference = {
  gameId: string;
  name: string;
  code: string;
  logo: string;
  provider: string;
  category: string;
};

export type PublicArticle = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  status: "DRAFT" | "PUBLISHED";
  category: PublicArticleCategory;
  relatedGame?: PublicArticleGameReference | null;
  isFeatured: boolean;
  sortOrder: number;
  readingMinutes: number;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: {
    adminId: string;
    name: string;
    email: string;
    role: string;
  } | null;
  updatedBy?: {
    adminId: string;
    name: string;
    email: string;
    role: string;
  } | null;
};

export type PublicArticleGameFilter = {
  gameId: string;
  name: string;
  code: string;
  logo: string;
  provider: string;
  articleCount: number;
};

export type PublicArticleListPage = {
  items: PublicArticle[];
  availableGames: PublicArticleGameFilter[];
  filters: {
    category: string;
    game: string;
  };
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type StorefrontReviewEntry = {
  _id: string;
  customerDisplay: string;
  rating: number;
  comment: string;
  invoiceNumber?: string;
  gameSnapshot?: {
    name: string;
    code: string;
    provider: string;
    category: string;
    logo: string;
  } | null;
  createdAt?: string | null;
};

export type StorefrontGameReviewSummary = {
  averageRating: number;
  totalReviews: number;
  totalComments: number;
  ratingBreakdown: Array<{
    rating: number;
    count: number;
  }>;
  commentsVisible: boolean;
  recentComments: StorefrontReviewEntry[];
};

export type StorefrontOrderReviewState = {
  canSubmit: boolean;
  hasSubmitted: boolean;
  review: {
    rating: number;
    comment: string;
    createdAt?: string | null;
  } | null;
};

export type PublicReviewsPage = {
  items: StorefrontReviewEntry[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  summary: StorefrontGameReviewSummary;
};

export type PublicSiteSetting = {
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

export type StorefrontVariantCategory = {
  _id: string;
  name: string;
  order: number;
};

export type StorefrontGame = {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  bannerUrl?: string;
  popupEnabled?: boolean;
  popupTitle?: string;
  popupMessage?: string;
  popupImageUrl?: string;
  category?: string;
  provider?: string;
  syncSource?: string;
  isTrending?: boolean;
  trendingOrder?: number;
  catalogOrder?: number;
  variantCategories?: StorefrontVariantCategory[];
};

export type StorefrontGameInputOption = {
  value: string;
  title: string;
};

export type StorefrontGameInput = {
  name: string;
  type: string;
  title: string;
  options: StorefrontGameInputOption[];
  placeholder: string;
  minLength: number;
  maxLength: number;
  regexValidation: string;
};

export type StorefrontVariant = {
  _id: string;
  name: string;
  providerCode: string;
  productCode: string;
  basePrice: number;
  markup: number;
  price: number;
  currency: string;
  duration: number;
  region: string;
  logo?: string;
  status?: string;
  syncSource?: string;
  variantCategoryId?: string;
};

export type StorefrontGameDetail = {
  game: StorefrontGame & {
    inputs: StorefrontGameInput[];
  };
  variants: StorefrontVariant[];
};

export type StorefrontPaymentMethod = {
  _id: string;
  name: string;
  code: string;
  provider?: string;
  logo?: string;
  balanceAmount?: number;
  type: string;
  displayMode: "grouped" | "standalone";
  category?: {
    _id: string;
    name: string;
    code: string;
    order: number;
  } | null;
  feeType: "fixed" | "percent" | "mixed";
  feeValue: number;
  feeFixed: number;
  feePercent: number;
  currency: string;
  gatewayChannelCode?: string;
  description?: string;
  order: number;
};

export type StorefrontBalanceTransaction = {
  id: string;
  type: string;
  source: string;
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  invoiceNumber: string;
  orderId: string;
  createdByAdmin: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type StorefrontPromoCode = {
  _id: string;
  title: string;
  code: string;
  description: string;
  discountType: "fixed" | "percent";
  discountValue: number;
  minimumOrderAmount: number;
  maxDailyUses: number;
  applicableGameIds: string[];
  applicableCategories: string[];
  isActive: boolean;
  order: number;
  dailyUsageCount: number;
  remainingDailyUses: number | null;
  discountAmount: number;
  isAvailable: boolean;
  availabilityReason: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type StorefrontOrder = {
  _id: string;
  invoiceNumber: string;
  orderType: "PURCHASE" | "BALANCE_TOPUP";
  provider: string;
  providerInvoiceNumber: string;
  providerReferenceNumber: string;
  paymentReferenceNumber: string;
  status: string;
  paymentStatus: string;
  providerStatus: string;
  quantity: number;
  customerInputs: Array<{
    name: string;
    title: string;
    type: string;
    value: string;
  }>;
  customerDisplay: string;
  paymentMethodCode: string;
  paymentMethodName: string;
  paymentMethodSnapshot: {
    name: string;
    code: string;
    provider: string;
    type: string;
    categoryName: string;
    categoryCode: string;
    logo: string;
    currency: string;
    feeType: string;
    feeValue: number;
    feeFixed: number;
    feePercent: number;
    gatewayChannelCode: string;
    description: string;
    accountHolderName: string;
    accountNumber: string;
  };
  contactDetail: {
    email: string;
    phoneCountryCode: string;
    phoneNumber: string;
  };
  paymentGateway: {
    provider: string;
    channelCode: string;
    transactionId: string;
    reference: string;
    payUrl: string;
    checkoutUrl: string;
    qrLink: string;
    qrString: string;
    virtualAccountNumber: string;
    instructionsHtml: string;
    rawStatus: string;
    totalPaid: number;
    netAmount: number;
    expiresAt: string;
    updatedAt: string;
  };
  price: {
    currency: string;
    buyPrice: number;
    sellPrice: number;
    profit: number;
    promoDiscount: number;
    subtotalAfterDiscount: number;
    paymentFee: number;
    paymentFeeFixed: number;
    paymentFeePercent: number;
    totalAmount: number;
  };
  promoSnapshot: {
    promoId?: string | null;
    title: string;
    code: string;
    description: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    minimumOrderAmount: number;
    maxDailyUses: number;
    applicableGameIds: string[];
    applicableCategories: string[];
  };
  region: string;
  gameSnapshot: {
    name: string;
    code: string;
    provider: string;
    category: string;
    logo: string;
  };
  variantSnapshot: {
    name: string;
    providerCode: string;
    logo: string;
    currency: string;
    basePrice: number;
    sellPrice: number;
  };
  review: StorefrontOrderReviewState;
  providerMessage: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type RecentPublicOrder = {
  _id: string;
  invoiceNumber: string;
  gameName: string;
  variantName: string;
  quantity: number;
  phoneNumber: string;
  currency: string;
  totalAmount: number;
  status: string;
  createdAt: string;
};
