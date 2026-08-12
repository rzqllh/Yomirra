"use client";

import { Bell } from "@phosphor-icons/react";
import { UpdatesList } from "@/components/updates/updates-list";
import { PageHeader } from "@/components/app/header";
import { YomirraSurface } from "@/components/ui/layout";

export default function UpdatesPage() {
  return (
    <>
      <h1 className="sr-only">Update Terbaru - Yomirra</h1>

      <YomirraSurface
        variant="base"
        className="flex-1 w-full max-w-7xl mx-auto md:pb-8"
      >
        <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:pt-8 md:px-8 pb-6">
          <PageHeader
            title="Updates"
            description="Manga di library Anda yang memiliki chapter baru."
            icon={<Bell size={32} weight="duotone" />}
          />
          <UpdatesList />
        </div>
      </YomirraSurface>
    </>
  );
}
