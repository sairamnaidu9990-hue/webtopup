export type PromoCodeDiscountType = "fixed" | "percent";

export type PromoCodeGameScope = {
  _id: string;
  name: string;
  code: string;
  category?: string;
  logo?: string;
};

export type PromoCode = {
  _id: string;
  title: string;
  code: string;
  description: string;
  discountType: PromoCodeDiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maxDailyUses: number;
  applicableGameIds: string[];
  applicableGames: PromoCodeGameScope[];
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
