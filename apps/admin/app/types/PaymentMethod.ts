export type PaymentMethodType =
  | "bank_transfer"
  | "ewallet"
  | "qris"
  | "retail"
  | "virtual_account";

export type PaymentMethodDisplayMode = "grouped" | "standalone";

export type PaymentFeeType = "fixed" | "percent" | "mixed";

export type PaymentMethodCategory = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentMethod = {
  _id: string;
  name: string;
  code: string;
  provider?: string;
  category?: PaymentMethodCategory | null;
  logo?: string;
  type: PaymentMethodType;
  displayMode?: PaymentMethodDisplayMode;
  feeType: PaymentFeeType;
  feeValue: number;
  feeFixed?: number;
  feePercent?: number;
  currency?: string;
  gatewayChannelCode?: string;
  description?: string;
  accountHolderName?: string;
  accountNumber?: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};
