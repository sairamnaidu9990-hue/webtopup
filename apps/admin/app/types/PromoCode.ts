export type PromoCodeDiscountType = "fixed" | "percent";

export type PromoCode = {
  _id: string;
  title: string;
  code: string;
  description: string;
  discountType: PromoCodeDiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maxDailyUses: number;
  applicableCategories: string[];
  isActive: boolean;
  order: number;
  dailyUsageCount?: number;
  remainingDailyUses?: number | null;
  discountAmount?: number;
  isAvailable?: boolean;
  availabilityReason?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};
