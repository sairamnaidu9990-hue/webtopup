export type OrderStatus =
  | "UNPAID"
  | "PAID"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED"
  | "EXPIRED";

export type PaymentStatus =
  | "UNPAID"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "REFUNDED";

export type Order = {
  _id: string;
  invoiceNumber: string;
  provider?: string;
  providerInvoiceNumber?: string;
  providerReferenceNumber?: string;
  paymentReferenceNumber?: string;
  gameSnapshot?: {
    name?: string;
    code?: string;
    provider?: string;
    category?: string;
    logo?: string;
  };
  variantSnapshot?: {
    name?: string;
    providerCode?: string;
    logo?: string;
    currency?: string;
    basePrice?: number;
    sellPrice?: number;
  };
  customerInputs?: Array<{
    name?: string;
    title?: string;
    type?: string;
    value?: string;
  }>;
  customerDisplay?: string;
  contactDetail?: {
    email?: string;
    phoneCountryCode?: string;
    phoneNumber?: string;
  };
  region?: string;
  price?: {
    currency?: string;
    buyPrice?: number;
    sellPrice?: number;
    profit?: number;
  };
  paymentMethodCode?: string;
  paymentMethodName?: string;
  paymentStatus?: PaymentStatus;
  providerStatus?: string;
  status?: OrderStatus;
  providerMessage?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderSummary = {
  totalOrders: number;
  successOrders: number;
  failedOrders: number;
  processingOrders: number;
};
