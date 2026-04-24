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
  paymentMethodSnapshot?: {
    name?: string;
    code?: string;
    provider?: string;
    type?: string;
    categoryName?: string;
    categoryCode?: string;
    logo?: string;
    currency?: string;
    feeType?: string;
    feeValue?: number;
    feeFixed?: number;
    feePercent?: number;
    gatewayChannelCode?: string;
    description?: string;
    accountHolderName?: string;
    accountNumber?: string;
  };
  paymentGateway?: {
    provider?: string;
    channelCode?: string;
    transactionId?: string;
    reference?: string;
    payUrl?: string;
    checkoutUrl?: string;
    qrLink?: string;
    qrString?: string;
    virtualAccountNumber?: string;
    instructionsHtml?: string;
    rawStatus?: string;
    totalPaid?: number;
    netAmount?: number;
    expiresAt?: string | null;
    updatedAt?: string | null;
  };
  region?: string;
  price?: {
    currency?: string;
    buyPrice?: number;
    sellPrice?: number;
    profit?: number;
    paymentFee?: number;
    paymentFeeFixed?: number;
    paymentFeePercent?: number;
    totalAmount?: number;
  };
  paymentMethodCode?: string;
  paymentMethodName?: string;
  paymentStatus?: PaymentStatus;
  providerStatus?: string;
  status?: OrderStatus;
  providerMessage?: string;
  notes?: string;
  paidAt?: string | null;
  processingAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  expiredAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderSummary = {
  totalOrders: number;
  successOrders: number;
  failedOrders: number;
  processingOrders: number;
};

export type OrderDashboardSummary = {
  totalOrders: number;
  totalBasePrice: number;
  totalSellPrice: number;
  totalProfit: number;
  recentOrders: Order[];
};
