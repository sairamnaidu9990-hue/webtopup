export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin";
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};
