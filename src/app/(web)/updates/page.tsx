"use client";

import * as React from "react";
import { CalendarBlank } from "@phosphor-icons/react";
import { PageHeader } from "@/components/app/header";
import { UpdatesList } from "@/components/updates/updates-list";

export default function UpdatesPage() {
  return (
    <div className="flex flex-col min-h-screen w-full max-w-7xl mx-auto pb-[calc(var(--bottom-nav-height,80px)+24px)] md:pb-10 md:px-8">
      <div className="px-4 pt-[calc(var(--mobile-header-height,56px)+var(--safe-top,0px)+16px)] md:px-0 md:pt-8">
        <PageHeader
          title="Jadwal Rilis Mingguan"
          description="Pantau kalender update komik bookmark ala Notion (Senin – Minggu)"
          icon={<CalendarBlank size={24} weight="duotone" />}
          showBack={true}
        />
      </div>

      <div className="px-4 md:px-0 mt-2 outline-none">
        <UpdatesList hideHeader={true} />
      </div>
    </div>
  );
}
