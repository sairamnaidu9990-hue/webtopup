export type CustomerOrder = {
  _id: string;
  invoiceNumber: string;
  orderType?: "PURCHASE" | "BALANCE_TOPUP";
  gameCode?: string;
  variantId?: string;
  status: string;
  paymentStatus: string;
  providerStatus: string;
  quantity?: number;
  customerInputs?: Array<{
    name?: string;
    title?: string;
    type?: string;
    value?: string;
  }>;
  contactDetail?: {
    email?: string;
    phoneCountryCode?: string;
    phoneNumber?: string;
  };
  paymentMethodCode?: string;
  paymentMethodName?: string;
  providerMessage?: string;
  notes?: string;
  createdAt?: string;
  gameSnapshot?: {
    name?: string;
    code?: string;
    logo?: string;
    category?: string;
  };
  variantSnapshot?: {
    name?: string;
  };
  price?: {
    currency?: string;
    totalAmount?: number;
    sellPrice?: number;
  };
};
