"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type StorefrontCustomer = {
  id: string;
  username: string;
  name: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  balance: number;
  isActive: boolean;
};

type CustomerSessionContextValue = {
  customer: StorefrontCustomer | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const CustomerSessionContext = createContext<CustomerSessionContextValue | null>(
  null
);

export function CustomerSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [customer, setCustomer] = useState<StorefrontCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customer-auth/me", {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setCustomer(null);
        return;
      }

      setCustomer(payload?.customer || null);
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/customer-auth/logout", {
        method: "POST",
      });
    } finally {
      setCustomer(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      customer,
      loading,
      refresh,
      logout,
    }),
    [customer, loading, refresh, logout]
  );

  return (
    <CustomerSessionContext.Provider value={value}>
      {children}
    </CustomerSessionContext.Provider>
  );
}

export function useCustomerSession() {
  const context = useContext(CustomerSessionContext);

  if (!context) {
    throw new Error("useCustomerSession harus dipakai di dalam CustomerSessionProvider");
  }

  return context;
}
