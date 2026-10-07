"use client";

import * as React from "react";
import { CalendarBlank } from "@phosphor-icons/react";
import { PageHeader } from "@/components/chrome/header";
import { UpdatesList } from "@/components/updates/updates-list";
import { YomirraSurface, PageContainer } from "@/components/ui/layout";

export default function UpdatesPage() {
  return (
    <YomirraSurface variant="base" className="min-h-screen">
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Jadwal Mingguan"
          description="Lihat perkiraan jadwal chapter baru dari komik yang kamu simpan."
          icon={<CalendarBlank size={24} weight="duotone" />}
          showBack={true}
        />

        <div className="mt-2 outline-none">
          <UpdatesList hideHeader={true} />
        </div>
      </PageContainer>
    </YomirraSurface>
  );
}
