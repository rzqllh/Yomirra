import * as React from "react";
import { MobilePageShell } from "@/components/app/mobile-page-shell";
import { Fire } from "@phosphor-icons/react/dist/ssr";

export default function PopularPage() {
  return (
    <MobilePageShell title="Populer" className="p-0">
      <div className="flex h-[70vh] flex-col items-center justify-center p-4 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-surface-raised border border-border-subtle">
          <Fire size={32} className="text-text-muted" weight="duotone" />
        </div>
        <h1 className="text-lg font-bold text-text-primary">Daftar populer belum tersedia</h1>
        <p className="mt-2 text-sm text-text-muted">Fitur ini akan segera hadir.</p>
      </div>
    </MobilePageShell>
  );
}
