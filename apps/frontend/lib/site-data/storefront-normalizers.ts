import type {
  StorefrontGame,
  StorefrontGameInput,
  StorefrontPaymentMethod,
  StorefrontVariant,
} from "@/lib/site-data/types";

export function normalizeStorefrontGame(
  game?: Partial<StorefrontGame> | null
): StorefrontGame {
  return {
    _id: String(game?._id || ""),
    name: String(game?.name || "").trim(),
    code: String(game?.code || "").trim().toUpperCase(),
    logo: String(game?.logo || "").trim(),
    bannerUrl: String(game?.bannerUrl || "").trim(),
    popupEnabled: Boolean(game?.popupEnabled),
    popupTitle: String(game?.popupTitle || "").trim(),
    popupMessage: String(game?.popupMessage || "").trim(),
    popupImageUrl: String(game?.popupImageUrl || "").trim(),
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

export function normalizeStorefrontGameInput(
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

export function normalizeStorefrontVariant(
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

export function normalizeStorefrontPaymentMethod(
  paymentMethod?: Partial<StorefrontPaymentMethod> | null
): StorefrontPaymentMethod {
  const feeFixed = Number(
    paymentMethod?.feeFixed ??
      (paymentMethod?.feeType === "percent" ? 0 : paymentMethod?.feeValue || 0)
  );
  const feePercent = Number(
    paymentMethod?.feePercent ??
      (paymentMethod?.feeType === "percent" ? paymentMethod?.feeValue || 0 : 0)
  );

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
            code: String(paymentMethod.category.code || "")
              .trim()
              .toUpperCase(),
            order: Number(paymentMethod.category.order || 9999),
          }
        : null,
    feeType:
      paymentMethod?.feeType === "percent" || paymentMethod?.feeType === "mixed"
        ? paymentMethod.feeType
        : "fixed",
    feeValue: Number(paymentMethod?.feeValue || 0),
    feeFixed,
    feePercent,
    currency: String(paymentMethod?.currency || "IDR").trim().toUpperCase(),
    gatewayChannelCode: String(paymentMethod?.gatewayChannelCode || "").trim(),
    description: String(paymentMethod?.description || "").trim(),
    order: Number(paymentMethod?.order || 9999),
  };
}
