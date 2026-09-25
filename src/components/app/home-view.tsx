"use client";

import * as React from "react";
import { YomirraSurface } from "@/components/ui/layout";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { HeaderActions } from "@/components/app/header-actions";

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
        <div className="mx-auto flex max-w-9xl flex-col gap-6 px-4 pb-12 pt-[calc(var(--safe-top,0px)+16px)] md:px-8 md:pt-8 xl:px-10">
          {/* Mobile Utility Actions (hidden on desktop where TopNav is canonical) */}
          <div className="flex md:hidden items-center justify-between w-full">
            <span className="font-bold text-xs uppercase tracking-[0.14em] text-accent">Yomirra</span>
            <HeaderActions />
          </div>

          {/* Dynamic Feed Content */}
          <div className="flex flex-col gap-8 md:gap-10">
            {children}
          </div>
        </div>
      </YomirraSurface>
    </PullToRefresh>
  );
}
