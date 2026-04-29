type OrderDraftPayload = {
  gameCode: string;
  variantId: string;
  paymentMethodCode: string;
  promoCode: string;
  customerInputs: Array<{
    name: string;
    title: string;
    type: string;
    value: string;
  }>;
  contactDetail: {
    email: string;
    phoneCountryCode: string;
    phoneNumber: string;
  };
};

type CreateOrderDraftArgs = {
  payload: OrderDraftPayload;
  fallbackTotalAmount: number;
  fallbackCurrency: string;
};

export default async function createOrderDraft({
  payload,
  fallbackTotalAmount,
  fallbackCurrency,
}: CreateOrderDraftArgs) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responsePayload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      responsePayload &&
        typeof responsePayload === "object" &&
        "message" in responsePayload
        ? String(responsePayload.message || "Gagal membuat order draft")
        : "Gagal membuat order draft"
    );
  }

  const invoiceNumber =
    responsePayload &&
    typeof responsePayload === "object" &&
    "order" in responsePayload &&
    responsePayload.order &&
    typeof responsePayload.order === "object" &&
    "invoiceNumber" in responsePayload.order
      ? String(responsePayload.order.invoiceNumber || "")
      : "";
  const totalAmount =
    responsePayload &&
    typeof responsePayload === "object" &&
    "order" in responsePayload &&
    responsePayload.order &&
    typeof responsePayload.order === "object" &&
    "price" in responsePayload.order &&
    responsePayload.order.price &&
    typeof responsePayload.order.price === "object" &&
    "totalAmount" in responsePayload.order.price
      ? Number(responsePayload.order.price.totalAmount || fallbackTotalAmount)
      : fallbackTotalAmount;
  const currency =
    responsePayload &&
    typeof responsePayload === "object" &&
    "order" in responsePayload &&
    responsePayload.order &&
    typeof responsePayload.order === "object" &&
    "price" in responsePayload.order &&
    responsePayload.order.price &&
    typeof responsePayload.order.price === "object" &&
    "currency" in responsePayload.order.price
      ? String(responsePayload.order.price.currency || fallbackCurrency)
      : fallbackCurrency;

  return {
    invoiceNumber,
    totalAmount,
    currency,
  };
}
