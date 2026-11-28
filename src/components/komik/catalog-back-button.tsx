"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getNavigationParentHref } from "@/shared/lib/navigation-intent";
import { getSafeMangaDetailBackHref } from "@/shared/lib/routes";

export function CatalogBackButton({ fallback }: { fallback: string }) {
  const router = useRouter();

  return (
    <Button type="button" variant="ghost" className="min-h-11 gap-2" onClick={() => {
      const parent = getSafeMangaDetailBackHref(getNavigationParentHref() ?? null);
      if (parent) router.back();
      else router.replace(fallback);
    }}>
      <ArrowLeft size={18} aria-hidden="true" /> Kembali
    </Button>
  );
}
