export type PaymentMethodType =
  | "bank_transfer"
  | "ewallet"
  | "qris"
  | "retail"
  | "virtual_account";

export type PaymentFeeType = "fixed" | "percent";

export type PaymentMethod = {
  _id: string;
  name: string;
  code: string;
  provider?: string;
  logo?: string;
  type: PaymentMethodType;
  feeType: PaymentFeeType;
  feeValue: number;
  currency?: string;
  gatewayChannelCode?: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};
