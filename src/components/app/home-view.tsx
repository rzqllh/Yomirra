"use client";

import * as React from "react";
import { YomirraSurface } from "@/components/ui/layout";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { HeaderActions } from "@/components/app/header-actions";
import { PageHeader } from "@/components/app/header";
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
      <YomirraSurface variant="base" className="min-h-screen">
        <PageHeader
          title="Beranda"
          icon={<House size={20} weight="duotone" />}
          actions={<HeaderActions />}
          hideDesktop
        />
        <div className="mx-auto flex max-w-9xl flex-col gap-6 px-4 pb-12 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-8 md:pt-8 xl:px-10">
          {/* Dynamic Feed Content */}
          <div className="flex flex-col gap-8 md:gap-10">
            {children}
          </div>
        </div>
      </YomirraSurface>
    </PullToRefresh>
  );
}
