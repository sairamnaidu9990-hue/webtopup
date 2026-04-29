import type { StorefrontOrder } from "@/lib/site-data/types";

export function normalizeStorefrontOrder(
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
      feeFixed: Number(order?.paymentMethodSnapshot?.feeFixed || 0),
      feePercent: Number(order?.paymentMethodSnapshot?.feePercent || 0),
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
      channelCode: String(order?.paymentGateway?.channelCode || "")
        .trim()
        .toUpperCase(),
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
      promoDiscount: Number(order?.price?.promoDiscount || 0),
      subtotalAfterDiscount: Number(
        order?.price?.subtotalAfterDiscount ?? order?.price?.sellPrice ?? 0
      ),
      paymentFee: Number(order?.price?.paymentFee || 0),
      paymentFeeFixed: Number(order?.price?.paymentFeeFixed || 0),
      paymentFeePercent: Number(order?.price?.paymentFeePercent || 0),
      totalAmount: Number(order?.price?.totalAmount || 0),
    },
    promoSnapshot: {
      promoId: String(order?.promoSnapshot?.promoId || "").trim() || null,
      title: String(order?.promoSnapshot?.title || "").trim(),
      code: String(order?.promoSnapshot?.code || "").trim().toUpperCase(),
      description: String(order?.promoSnapshot?.description || "").trim(),
      discountType: String(order?.promoSnapshot?.discountType || "").trim(),
      discountValue: Number(order?.promoSnapshot?.discountValue || 0),
      discountAmount: Number(order?.promoSnapshot?.discountAmount || 0),
      minimumOrderAmount: Number(order?.promoSnapshot?.minimumOrderAmount || 0),
      maxDailyUses: Number(order?.promoSnapshot?.maxDailyUses || 0),
      applicableCategories: Array.isArray(order?.promoSnapshot?.applicableCategories)
        ? order.promoSnapshot.applicableCategories.map((item) =>
            String(item || "").trim()
          )
        : [],
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
      currency: String(order?.variantSnapshot?.currency || "IDR")
        .trim()
        .toUpperCase(),
      basePrice: Number(order?.variantSnapshot?.basePrice || 0),
      sellPrice: Number(order?.variantSnapshot?.sellPrice || 0),
    },
    review: {
      canSubmit: Boolean(order?.review?.canSubmit),
      hasSubmitted: Boolean(order?.review?.hasSubmitted),
      review: order?.review?.review
        ? {
            rating: Number(order?.review?.review?.rating || 0),
            comment: String(order?.review?.review?.comment || "").trim(),
            createdAt: order?.review?.review?.createdAt || null,
          }
        : null,
    },
    providerMessage: String(order?.providerMessage || "").trim(),
    notes: String(order?.notes || "").trim(),
    createdAt: String(order?.createdAt || ""),
    updatedAt: String(order?.updatedAt || ""),
  };
}
