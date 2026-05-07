export type CustomerOrder = {
  _id: string;
  invoiceNumber: string;
  orderType?: "PURCHASE" | "BALANCE_TOPUP";
  status: string;
  paymentStatus: string;
  providerStatus: string;
  quantity?: number;
  paymentMethodName?: string;
  providerMessage?: string;
  notes?: string;
  createdAt?: string;
  gameSnapshot?: {
    name?: string;
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
