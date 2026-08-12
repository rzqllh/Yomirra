"use client";

import * as React from "react";
import { YomirraSurface } from "@/components/ui/layout";
import { PageHeader } from "@/components/app/header";
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

        <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:pt-8 md:px-8 pb-4 md:pb-8 max-w-7xl mx-auto flex flex-col gap-7">
          <PageHeader
            title="Beranda"
            description="Temukan dan baca komik favoritmu di satu tempat."
            icon={<Compass size={32} weight="duotone" />}
            actions={<UpdatesBell />}
          />

          {/* Dynamic Source Feeds & Personalization */}
          {children}
        </div>
      </YomirraSurface>
    </PullToRefresh>
  );
}
