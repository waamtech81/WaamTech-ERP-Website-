"use client";

import { createContext, useContext } from "react";
import type { PortalDashboard } from "@/lib/portal/dashboard";
import { usePortalData } from "@/components/portal/use-portal-data";

type PortalDataContextValue = {
  data: PortalDashboard | null;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
};

const PortalDataContext = createContext<PortalDataContextValue | null>(null);

export function PortalDataProvider({ children }: { children: React.ReactNode }) {
  const value = usePortalData();
  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>;
}

export function usePortalContext() {
  const ctx = useContext(PortalDataContext);
  if (!ctx) {
    throw new Error("usePortalContext must be used within PortalDataProvider");
  }
  return ctx;
}
