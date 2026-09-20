"use client";

import { ReportSheet } from "@/components/shared/report-sheet";
import type { SourceMetadata } from "@/shared/sources/source-types";

interface ReportDevSheetProps {
  source: SourceMetadata | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDevSheet({ source, open, onOpenChange }: ReportDevSheetProps) {
  return (
    <ReportSheet
      open={open}
      onOpenChange={onOpenChange}
      context="source"
      subject={source?.name}
      sourceId={source?.id}
    />
  );
}

