"use client";

import * as React from "react";
import { YomirraSurface } from "@/components/ui/layout";
import { PageHeader } from "@/components/app/header";
import { Compass } from "@phosphor-icons/react";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { HeaderActions } from "@/components/app/header-actions";

interface HomeViewProps {
  children?: React.ReactNode;
}

export function HomeView({ children }: HomeViewProps) {
  return (
    <PullToRefresh>
      <YomirraSurface variant="base" className="min-h-screen">
        <h1 className="sr-only">Beranda Yomirra</h1>

        <div className="mx-auto flex max-w-[1370px] flex-col gap-7 px-4 pb-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-8 md:pb-8 md:pt-8 xl:px-12">
          <PageHeader
            title="Beranda"
            description="Rakmu, bacaan terbaru, dan pilihan hari ini."
            icon={<Compass size={24} weight="duotone" />}
            actions={<HeaderActions />}
          />

          <div className="border-l-2 border-accent pl-4 md:pl-6">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-accent">Bacaanmu dimulai di sini</p>
            <h2 className="ink-display mt-2 text-[clamp(34px,4vw,64px)] text-text-primary">Mau baca apa hari ini?</h2>
          </div>

          {/* Dynamic Source Feeds & Personalization */}
          {children}
        </div>
      </YomirraSurface>
    </PullToRefresh>
  );
}
