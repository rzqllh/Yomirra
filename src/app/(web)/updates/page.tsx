"use client";

import * as React from "react";
import { CalendarBlank } from "@phosphor-icons/react";
import { PageHeader } from "@/components/chrome/header";
import { UpdatesList } from "@/components/updates/updates-list";
import { PageContainer } from "@/components/ui/layout";
import { Surface } from "@/components/ui/surface";

export default function UpdatesPage() {
  return (
    <Surface variant="base" className="min-h-screen">
      <PageContainer hasMobileHeader>
        <PageHeader
          title="Jadwal Mingguan"
          description="Lihat perkiraan jadwal chapter baru dari komik yang kamu simpan."
          icon={<CalendarBlank size={24} weight="regular" />}
          showBack={true}
        />

        <div className="mt-2 outline-none">
          <UpdatesList hideHeader={true} />
        </div>
      </PageContainer>
    </Surface>
  );
}
