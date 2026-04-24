import { cache } from "react";

import { buildFrontendApiUrl } from "@/lib/runtimeConfig";

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

export type PublicSiteSetting = {
  siteName: string;
  siteLogoUrl: string;
  siteFaviconUrl: string;
  siteDomain: string;
  siteTitle: string;
  siteDescription: string;
  gameCategories: string[];
  bannerCount: number;
  bannerAutoSlideSeconds: number;
  floatingContactEnabled: boolean;
  floatingContactLabel: string;
  floatingContactUrl: string;
  banners: SiteBanner[];
  footerDescription: string;
  footerBottomText: string;
  footerSocialLinks: SiteFooterLink[];
  footerLinkColumns: SiteFooterColumn[];
  updatedAt?: string | null;
};

export type StorefrontGame = {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  bannerUrl?: string;
  category?: string;
  provider?: string;
  syncSource?: string;
  isTrending?: boolean;
  trendingOrder?: number;
  catalogOrder?: number;
  variantCategories?: StorefrontVariantCategory[];
};

export type StorefrontVariantCategory = {
  _id: string;
  name: string;
  order: number;
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
  logo?: string;
  type: string;
  category?: {
    _id: string;
    name: string;
    code: string;
    order: number;
  } | null;
  feeType: "fixed" | "percent";
  feeValue: number;
  currency: string;
  gatewayChannelCode?: string;
  description?: string;
  order: number;
};

export type StorefrontOrder = {
  _id: string;
  invoiceNumber: string;
  provider: string;
  providerInvoiceNumber: string;
  providerReferenceNumber: string;
  paymentReferenceNumber: string;
  status: string;
  paymentStatus: string;
  providerStatus: string;
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
    paymentFee: number;
    totalAmount: number;
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
  providerMessage: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type RecentPublicOrder = {
  _id: string;
  invoiceNumber: string;
  phoneNumber: string;
  currency: string;
  totalAmount: number;
  status: string;
  createdAt: string;
};

const defaultSiteSetting: PublicSiteSetting = {
  siteName: "WebTopup",
  siteLogoUrl: "",
  siteFaviconUrl: "",
  siteDomain: "",
  siteTitle: "WebTopup - Top Up Game Realtime",
  siteDescription:
    "Website top up game realtime dengan katalog yang dikelola langsung dari panel admin.",
  gameCategories: ["Topup Game", "Topup Pulsa", "Voucher", "Live Streaming"],
  bannerCount: 3,
  bannerAutoSlideSeconds: 5,
  floatingContactEnabled: false,
  floatingContactLabel: "Chat CS",
  floatingContactUrl: "",
  banners: [],
  footerDescription:
    "Top up game dan voucher digital dengan katalog yang dikelola langsung dari panel admin.",
  footerBottomText: "© 2026 WebTopup. All rights reserved.",
  footerSocialLinks: [],
  footerLinkColumns: [],
};

function normalizeStorefrontGame(
  game?: Partial<StorefrontGame> | null
): StorefrontGame {
  return {
    _id: String(game?._id || ""),
    name: String(game?.name || "").trim(),
    code: String(game?.code || "").trim().toUpperCase(),
    logo: String(game?.logo || "").trim(),
    bannerUrl: String(game?.bannerUrl || "").trim(),
    category: String(game?.category || "Topup Game").trim(),
    provider: String(game?.provider || "").trim(),
    syncSource: String(game?.syncSource || "").trim(),
    isTrending: Boolean(game?.isTrending),
    trendingOrder: Number(game?.trendingOrder || 0),
    catalogOrder: Number(game?.catalogOrder || 0),
    variantCategories: Array.isArray(game?.variantCategories)
      ? game.variantCategories
          .map((category) => ({
            _id: String(category?._id || "").trim(),
            name: String(category?.name || "").trim(),
            order: Number(category?.order || 0),
          }))
          .filter((category) => category._id && category.name)
      : [],
  };
}

function normalizeStorefrontGameInput(
  input?: Partial<StorefrontGameInput> | null
): StorefrontGameInput {
  return {
    name: String(input?.name || "").trim(),
    type: String(input?.type || "").trim(),
    title: String(input?.title || "").trim(),
    options: Array.isArray(input?.options)
      ? input.options.map((option) => ({
          value: String(option?.value || "").trim(),
          title: String(option?.title || "").trim(),
        }))
      : [],
    placeholder: String(input?.placeholder || "").trim(),
    minLength: Number(input?.minLength || 0),
    maxLength: Number(input?.maxLength || 0),
    regexValidation: String(input?.regexValidation || "").trim(),
  };
}

function normalizeStorefrontVariant(
  variant?: Partial<StorefrontVariant> | null
): StorefrontVariant {
  return {
    _id: String(variant?._id || ""),
    name: String(variant?.name || "").trim(),
    providerCode: String(variant?.providerCode || "").trim(),
    productCode: String(variant?.productCode || "").trim(),
    basePrice: Number(variant?.basePrice || 0),
    markup: Number(variant?.markup || 0),
    price: Number(variant?.price || 0),
    currency: String(variant?.currency || "").trim(),
    duration: Number(variant?.duration || 0),
    region: String(variant?.region || "").trim(),
    logo: String(variant?.logo || "").trim(),
    status: String(variant?.status || "").trim(),
    syncSource: String(variant?.syncSource || "").trim(),
    variantCategoryId: String(variant?.variantCategoryId || "").trim(),
  };
}

function normalizeStorefrontPaymentMethod(
  paymentMethod?: Partial<StorefrontPaymentMethod> | null
): StorefrontPaymentMethod {
  return {
    _id: String(paymentMethod?._id || ""),
    name: String(paymentMethod?.name || "").trim(),
    code: String(paymentMethod?.code || "").trim().toUpperCase(),
    logo: String(paymentMethod?.logo || "").trim(),
    type: String(paymentMethod?.type || "bank_transfer").trim(),
    category:
      paymentMethod?.category &&
      typeof paymentMethod.category === "object" &&
      String(paymentMethod.category._id || "").trim()
        ? {
            _id: String(paymentMethod.category._id || "").trim(),
            name: String(paymentMethod.category.name || "").trim(),
            code: String(paymentMethod.category.code || "").trim().toUpperCase(),
            order: Number(paymentMethod.category.order || 9999),
          }
        : null,
    feeType: paymentMethod?.feeType === "percent" ? "percent" : "fixed",
    feeValue: Number(paymentMethod?.feeValue || 0),
    currency: String(paymentMethod?.currency || "IDR").trim().toUpperCase(),
    gatewayChannelCode: String(paymentMethod?.gatewayChannelCode || "").trim(),
    description: String(paymentMethod?.description || "").trim(),
    order: Number(paymentMethod?.order || 9999),
  };
}

function normalizeStorefrontOrder(
  order?: Partial<StorefrontOrder> | null
): StorefrontOrder {
  return {
    _id: String(order?._id || "").trim(),
    invoiceNumber: String(order?.invoiceNumber || "").trim(),
    provider: String(order?.provider || "").trim(),
    providerInvoiceNumber: String(order?.providerInvoiceNumber || "").trim(),
    providerReferenceNumber: String(order?.providerReferenceNumber || "").trim(),
    paymentReferenceNumber: String(order?.paymentReferenceNumber || "").trim(),
    status: String(order?.status || "").trim().toUpperCase(),
    paymentStatus: String(order?.paymentStatus || "").trim().toUpperCase(),
    providerStatus: String(order?.providerStatus || "").trim().toUpperCase(),
    customerInputs: Array.isArray(order?.customerInputs)
      ? order.customerInputs.map((input) => ({
          name: String(input?.name || "").trim(),
          title: String(input?.title || "").trim(),
          type: String(input?.type || "").trim(),
          value: String(input?.value || "").trim(),
        }))
      : [],
    customerDisplay: String(order?.customerDisplay || "").trim(),
    paymentMethodCode: String(order?.paymentMethodCode || "").trim().toUpperCase(),
    paymentMethodName: String(order?.paymentMethodName || "").trim(),
    paymentMethodSnapshot: {
      name: String(order?.paymentMethodSnapshot?.name || "").trim(),
      code: String(order?.paymentMethodSnapshot?.code || "").trim().toUpperCase(),
      provider: String(order?.paymentMethodSnapshot?.provider || "").trim(),
      type: String(order?.paymentMethodSnapshot?.type || "").trim(),
      categoryName: String(order?.paymentMethodSnapshot?.categoryName || "").trim(),
      categoryCode: String(order?.paymentMethodSnapshot?.categoryCode || "")
        .trim()
        .toUpperCase(),
      logo: String(order?.paymentMethodSnapshot?.logo || "").trim(),
      currency: String(order?.paymentMethodSnapshot?.currency || "IDR")
        .trim()
        .toUpperCase(),
      feeType: String(order?.paymentMethodSnapshot?.feeType || "").trim(),
      feeValue: Number(order?.paymentMethodSnapshot?.feeValue || 0),
      gatewayChannelCode: String(
        order?.paymentMethodSnapshot?.gatewayChannelCode || ""
      ).trim(),
      description: String(order?.paymentMethodSnapshot?.description || "").trim(),
      accountHolderName: String(
        order?.paymentMethodSnapshot?.accountHolderName || ""
      ).trim(),
      accountNumber: String(order?.paymentMethodSnapshot?.accountNumber || "").trim(),
    },
    contactDetail: {
      email: String(order?.contactDetail?.email || "").trim(),
      phoneCountryCode: String(order?.contactDetail?.phoneCountryCode || "+62").trim(),
      phoneNumber: String(order?.contactDetail?.phoneNumber || "").trim(),
    },
    paymentGateway: {
      provider: String(order?.paymentGateway?.provider || "").trim(),
      channelCode: String(order?.paymentGateway?.channelCode || "").trim().toUpperCase(),
      transactionId: String(order?.paymentGateway?.transactionId || "").trim(),
      reference: String(order?.paymentGateway?.reference || "").trim(),
      payUrl: String(order?.paymentGateway?.payUrl || "").trim(),
      checkoutUrl: String(order?.paymentGateway?.checkoutUrl || "").trim(),
      qrLink: String(order?.paymentGateway?.qrLink || "").trim(),
      qrString: String(order?.paymentGateway?.qrString || "").trim(),
      virtualAccountNumber: String(
        order?.paymentGateway?.virtualAccountNumber || ""
      ).trim(),
      instructionsHtml: String(
        order?.paymentGateway?.instructionsHtml || ""
      ).trim(),
      rawStatus: String(order?.paymentGateway?.rawStatus || "").trim(),
      totalPaid: Number(order?.paymentGateway?.totalPaid || 0),
      netAmount: Number(order?.paymentGateway?.netAmount || 0),
      expiresAt: String(order?.paymentGateway?.expiresAt || ""),
      updatedAt: String(order?.paymentGateway?.updatedAt || ""),
    },
    price: {
      currency: String(order?.price?.currency || "IDR").trim().toUpperCase(),
      buyPrice: Number(order?.price?.buyPrice || 0),
      sellPrice: Number(order?.price?.sellPrice || 0),
      profit: Number(order?.price?.profit || 0),
      paymentFee: Number(order?.price?.paymentFee || 0),
      totalAmount: Number(order?.price?.totalAmount || 0),
    },
    region: String(order?.region || "ID").trim().toUpperCase(),
    gameSnapshot: {
      name: String(order?.gameSnapshot?.name || "").trim(),
      code: String(order?.gameSnapshot?.code || "").trim().toUpperCase(),
      provider: String(order?.gameSnapshot?.provider || "").trim(),
      category: String(order?.gameSnapshot?.category || "").trim(),
      logo: String(order?.gameSnapshot?.logo || "").trim(),
    },
    variantSnapshot: {
      name: String(order?.variantSnapshot?.name || "").trim(),
      providerCode: String(order?.variantSnapshot?.providerCode || "").trim(),
      logo: String(order?.variantSnapshot?.logo || "").trim(),
      currency: String(order?.variantSnapshot?.currency || "IDR").trim().toUpperCase(),
      basePrice: Number(order?.variantSnapshot?.basePrice || 0),
      sellPrice: Number(order?.variantSnapshot?.sellPrice || 0),
    },
    providerMessage: String(order?.providerMessage || "").trim(),
    notes: String(order?.notes || "").trim(),
    createdAt: String(order?.createdAt || ""),
    updatedAt: String(order?.updatedAt || ""),
  };
}

function syncBannerLength(
  banners: SiteBanner[],
  bannerCount: number
): SiteBanner[] {
  return Array.from({ length: bannerCount }, (_, index) => ({
    title: banners[index]?.title || "",
    imageUrl: banners[index]?.imageUrl || "",
  }));
}

function normalizeSiteSetting(
  siteSetting?: Partial<PublicSiteSetting> | null
): PublicSiteSetting {
  const bannerCount = Math.min(
    Math.max(Number(siteSetting?.bannerCount ?? defaultSiteSetting.bannerCount) || 0, 0),
    10
  );

  return {
    ...defaultSiteSetting,
    ...siteSetting,
    gameCategories: (() => {
      const nextCategories =
        Array.isArray(siteSetting?.gameCategories)
          ? siteSetting.gameCategories
              .map((item) => String(item || "").trim())
              .filter(Boolean)
          : [];

      return nextCategories.length > 0
        ? nextCategories
        : defaultSiteSetting.gameCategories;
    })(),
    bannerCount,
    bannerAutoSlideSeconds: Math.min(
      Math.max(
        Number(
          siteSetting?.bannerAutoSlideSeconds ??
            defaultSiteSetting.bannerAutoSlideSeconds
        ) || defaultSiteSetting.bannerAutoSlideSeconds,
        1
      ),
      30
    ),
    floatingContactEnabled: Boolean(siteSetting?.floatingContactEnabled),
    floatingContactLabel:
      String(siteSetting?.floatingContactLabel || "").trim() ||
      defaultSiteSetting.floatingContactLabel,
    floatingContactUrl: String(siteSetting?.floatingContactUrl || "").trim(),
    banners: syncBannerLength(
      Array.isArray(siteSetting?.banners) ? siteSetting.banners : [],
      bannerCount
    ),
    footerSocialLinks: Array.isArray(siteSetting?.footerSocialLinks)
      ? siteSetting.footerSocialLinks
          .map((item) => ({
            label: String(item?.label || "").trim(),
            url: String(item?.url || "").trim(),
          }))
          .filter((item) => item.label || item.url)
      : defaultSiteSetting.footerSocialLinks,
    footerLinkColumns: Array.isArray(siteSetting?.footerLinkColumns)
      ? siteSetting.footerLinkColumns
          .map((column) => ({
            title: String(column?.title || "").trim(),
            links: Array.isArray(column?.links)
              ? column.links
                  .map((item) => ({
                    label: String(item?.label || "").trim(),
                    url: String(item?.url || "").trim(),
                  }))
                  .filter((item) => item.label || item.url)
              : [],
          }))
          .filter((column) => column.title || column.links.length > 0)
      : defaultSiteSetting.footerLinkColumns,
  };
}

export const getPublicSiteSetting = cache(async (): Promise<PublicSiteSetting> => {
  try {
    const response = await fetch(
      await buildFrontendApiUrl("/api/site-settings/public"),
      {
        next: {
          revalidate: 60,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch site setting");
    }

    const payload = await response.json();
    return normalizeSiteSetting(payload.siteSetting);
  } catch {
    return defaultSiteSetting;
  }
});

export const getStorefrontGames = cache(
  async (): Promise<{
    trendingGames: StorefrontGame[];
    allGames: StorefrontGame[];
  }> => {
    try {
      const response = await fetch(
        await buildFrontendApiUrl("/api/storefront/games"),
        {
          next: {
            revalidate: 60,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch storefront games");
      }

      const payload = await response.json();

      return {
        trendingGames: Array.isArray(payload.trendingGames)
          ? payload.trendingGames.map((game: StorefrontGame) =>
              normalizeStorefrontGame(game)
            )
          : [],
        allGames: Array.isArray(payload.allGames)
          ? payload.allGames.map((game: StorefrontGame) =>
              normalizeStorefrontGame(game)
            )
          : [],
      };
    } catch {
      return {
        trendingGames: [],
        allGames: [],
      };
    }
  }
);

export const getStorefrontGameDetail = cache(
  async (code: string): Promise<StorefrontGameDetail | null> => {
    const normalizedCode = String(code || "").trim().toUpperCase();

    if (!normalizedCode) {
      return null;
    }

    try {
      const response = await fetch(
        await buildFrontendApiUrl(
          `/api/storefront/games/${encodeURIComponent(normalizedCode)}`
        ),
        {
          next: {
            revalidate: 60,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch storefront game detail");
      }

      const payload = await response.json();

      return {
        game: {
          ...normalizeStorefrontGame(payload.game),
          inputs: Array.isArray(payload.game?.inputs)
            ? payload.game.inputs.map(
                (input: StorefrontGameInput) =>
                  normalizeStorefrontGameInput(input)
              )
            : [],
        },
        variants: Array.isArray(payload.variants)
          ? payload.variants.map((variant: StorefrontVariant) =>
              normalizeStorefrontVariant(variant)
            )
          : [],
      };
    } catch {
      return null;
    }
  }
);

export const getPublicPaymentMethods = cache(
  async (): Promise<StorefrontPaymentMethod[]> => {
    try {
      const response = await fetch(
        await buildFrontendApiUrl("/api/payment-methods/public"),
        {
          next: {
            revalidate: 60,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch payment methods");
      }

      const payload = await response.json();

      return Array.isArray(payload.items)
        ? payload.items.map((paymentMethod: StorefrontPaymentMethod) =>
            normalizeStorefrontPaymentMethod(paymentMethod)
          )
        : [];
    } catch {
      return [];
    }
  }
);

export const getPublicOrderByInvoice = cache(
  async (invoiceNumber: string): Promise<StorefrontOrder | null> => {
    const normalizedInvoiceNumber = String(invoiceNumber || "").trim().toUpperCase();

    if (!normalizedInvoiceNumber) {
      return null;
    }

    try {
      const response = await fetch(
        await buildFrontendApiUrl(
          `/api/orders/invoice/${encodeURIComponent(normalizedInvoiceNumber)}`
        ),
        {
          next: {
            revalidate: 10,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch order invoice");
      }

      const payload = await response.json();
      return normalizeStorefrontOrder(payload.order);
    } catch {
      return null;
    }
  }
);

export const getRecentPublicOrders = cache(
  async (limit = 10): Promise<RecentPublicOrder[]> => {
    try {
      const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);
      const response = await fetch(
        await buildFrontendApiUrl(
          `/api/orders/recent?limit=${encodeURIComponent(String(safeLimit))}`
        ),
        {
          next: {
            revalidate: 20,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch recent public orders");
      }

      const payload = await response.json();

      return Array.isArray(payload.items)
        ? payload.items.map((item: Partial<RecentPublicOrder>) => ({
            _id: String(item?._id || "").trim(),
            invoiceNumber: String(item?.invoiceNumber || "").trim(),
            phoneNumber: String(item?.phoneNumber || "-").trim() || "-",
            currency: String(item?.currency || "IDR").trim().toUpperCase(),
            totalAmount: Number(item?.totalAmount || 0),
            status: String(item?.status || "").trim().toUpperCase(),
            createdAt: String(item?.createdAt || ""),
          }))
        : [];
    } catch {
      return [];
    }
  }
);
