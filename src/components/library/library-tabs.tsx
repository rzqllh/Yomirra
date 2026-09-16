"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SegmentedControl } from "@/components/ui/segmented-control";

export type LibraryTab = "koleksi" | "riwayat" | "updates";

export function LibraryTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentTab = (searchParams.get("tab") as LibraryTab) || "koleksi";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "koleksi") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div
      role="tablist"
      aria-label="Personal Library"
      className="w-full pb-4"
    >
      <SegmentedControl
        options={[
          { value: "koleksi", label: "Koleksi" },
          { value: "riwayat", label: "Riwayat" },
          { value: "updates", label: "Updates" },
        ]}
        value={currentTab}
        onChange={handleTabChange}
        variant="glass-floating"
        fullWidth
        className="h-[46px]"
        layoutId="library-main-tabs"
      />
    </div>
  );
}
