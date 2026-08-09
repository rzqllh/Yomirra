"use client";

import { Bell, ArrowsClockwise } from "@phosphor-icons/react";
import { UpdatesList } from "@/components/updates/updates-list";
import { YomirraPageHeader, DesktopPageTitle } from "@/components/app/header";
import { YomirraSurface } from "@/components/ui/layout";

export default function UpdatesPage() {
  return (
    <>
      <h1 className="sr-only">Update Terbaru - Yomirra</h1>

      {/* Mobile sticky header */}
      <YomirraPageHeader
        title="Updates"
        showBack={false}
        variant="transparent"
        icon={<Bell size={24} weight="duotone" />}
      />

      <YomirraSurface
        variant="base"
        className="flex-1 w-full max-w-7xl mx-auto md:pb-8"
      >
        {/* Desktop hero title */}
        <div className="hidden md:block px-4 pt-[calc(var(--safe-top)+24px)] pb-6">
          <DesktopPageTitle
            title="Updates"
            description="Manga di library Anda yang memiliki chapter baru."
            icon={<Bell size={32} weight="duotone" />}
          />
        </div>

        <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:pt-0 pb-6">
          <UpdatesList />
        </div>
      </YomirraSurface>
    </>
  );
}
