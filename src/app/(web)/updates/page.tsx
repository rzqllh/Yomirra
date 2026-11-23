"use client";

import * as React from "react";
import { DestinationHeader } from "@/components/chrome/header";
import { UpdatesList } from "@/components/updates/updates-list";
import { PageContainer } from "@/components/ui/layout";
import { Surface } from "@/components/ui/surface";

export default function UpdatesPage() {
  return (
    <Surface variant="base" className="min-h-screen">
      <PageContainer hasMobileHeader>
        <DestinationHeader destination="updates" />

        <div className="mt-2 outline-none">
          <UpdatesList hideHeader={true} />
        </div>
      </PageContainer>
    </Surface>
  );
}
