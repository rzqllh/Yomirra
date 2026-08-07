"use client";

import * as React from "react";
import { YomirraSurface } from "@/components/ui/layout";
import { YomirraPageHeader, DesktopPageTitle } from "@/components/app/header";
import { Compass } from "@phosphor-icons/react";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { UpdatesBell } from "@/components/app/updates-bell";

interface HomeViewProps {
  children?: React.ReactNode;
}

export function HomeView({ children }: HomeViewProps) {
  return (
    <PullToRefresh>
      <YomirraSurface variant="base" className="min-h-screen">
        <h1 className="sr-only">Beranda Yomirra</h1>
        <YomirraPageHeader
          title="Beranda"
          variant="transparent"
          icon={<Compass size={24} weight="duotone" />}
          action={<UpdatesBell />}
        />
        
        <div className="px-4 pt-2 md:pt-4 md:px-8 pb-28 md:pb-20 max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8">
          {/* Unified Desktop Header */}
          <div className="flex flex-col gap-4 relative z-50">
            <DesktopPageTitle 
              title="Beranda" 
              description="Temukan dan baca komik favoritmu di satu tempat."
              icon={<Compass size={32} weight="duotone" />}
              action={<UpdatesBell />}
            />
          </div>

          {/* Dynamic Source Feeds & Personalization */}
          {children}
        </div>
      </YomirraSurface>
    </PullToRefresh>
  );
}
