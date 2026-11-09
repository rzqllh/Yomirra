"use client";

import * as React from "react";
import { PageContainer } from "@/components/ui/layout";
import { Surface } from "@/components/ui/surface";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { HeaderActions } from "@/components/chrome/header-actions";
import { PageHeader } from "@/components/chrome/header";
import { House } from "@phosphor-icons/react";

interface HomeViewProps {
  children?: React.ReactNode;
}

/**
 * Editorial canvas for Yomirra Beranda.
 * Clean, direct layout starting immediately with editorial spotlights and feeds.
 */
export function HomeView({ children }: HomeViewProps) {
  return (
    <PullToRefresh>
      <Surface variant="base" className="min-h-screen">
        <PageHeader
          title="Beranda"
          icon={<House size={20} weight="regular" />}
          actions={<HeaderActions />}
          hideDesktop
        />
        <PageContainer hasMobileHeader>
          <div className="flex flex-col gap-8 md:gap-10">
            {children}
          </div>
        </PageContainer>
      </Surface>
    </PullToRefresh>
  );
}
