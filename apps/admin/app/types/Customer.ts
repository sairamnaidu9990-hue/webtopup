export type CustomerAccount = {
  id: string;
  username: string;
  name: string;
  email: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
  balance: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};
