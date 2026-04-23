export type SyncLog = {
  _id: string;
  provider: string;
  action: string;
  scope?: string;
  status: "PROCESSING" | "SUCCESS" | "FAILED";
  syncSource?: string;
  region?: string;
  productCode?: string;
  summary?: Record<string, unknown> | null;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
  triggeredBy?: {
    adminId?: string | null;
    name?: string;
    email?: string;
    role?: string;
  };
};
