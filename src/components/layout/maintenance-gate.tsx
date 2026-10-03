"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { MaintenanceView } from "./maintenance-view";

export interface MaintenanceGateProps {
  children: React.ReactNode;
  initialConfig?: {
    enabled: boolean;
    message?: string;
  };
}

export function MaintenanceGate({
  children,
  initialConfig,
}: MaintenanceGateProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  // Admin portal is strictly exempt from maintenance restriction
  if (isAdmin) {
    return <>{children}</>;
  }

  // If maintenance is active, render the dedicated view without reader/navigation chrome
  if (initialConfig?.enabled) {
    return <MaintenanceView message={initialConfig.message} />;
  }

  return <>{children}</>;
}
