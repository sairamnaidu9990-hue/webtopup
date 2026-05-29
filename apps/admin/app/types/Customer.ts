export type CustomerAccount = {
  id: string;
  username: string;
  name: string;
  email: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
  balance: number;
  referralCode?: string;
  referredBy?: string;
  loyaltyPoints?: number;
  totalLoyaltyPointsEarned?: number;
  totalLoyaltyPointsRedeemed?: number;
  referralBonusGrantedAt?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};
