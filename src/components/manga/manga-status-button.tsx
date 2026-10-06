"use client";

import * as React from "react";
import { useCollectionStore } from "@/shared/store/collection-store";
import { MangaKey, ReadingStatus } from "@/shared/types/collection";
import { Button } from "@/components/ui/button";
import { BookOpenText } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMounted } from "@/shared/hooks/use-mounted";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";

interface MangaStatusButtonProps {
  sourceId: string;
  mangaId: string;
}

const STATUS_OPTIONS: { value: ReadingStatus; label: string; shortLabel: string }[] = [
  { value: "reading", label: "Sedang Dibaca", shortLabel: "Dibaca" },
  { value: "completed", label: "Selesai", shortLabel: "Selesai" },
  { value: "on-hold", label: "Ditunda", shortLabel: "Ditunda" },
  { value: "dropped", label: "Dihentikan", shortLabel: "Batal" },
  { value: "plan-to-read", label: "Akan Dibaca", shortLabel: "Rencana" },
];

export function MangaStatusButton({ sourceId, mangaId }: MangaStatusButtonProps) {
  const mangaKey: MangaKey = `${sourceId}::${mangaId}`;
  const readingStatus = useCollectionStore((state) => state.readingStatusByManga[mangaKey]);
  const setReadingStatus = useCollectionStore((state) => state.setReadingStatus);
  const clearReadingStatus = useCollectionStore((state) => state.clearReadingStatus);
  const mounted = useMounted();

  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (status: ReadingStatus) => {
    if (readingStatus === status) {
      clearReadingStatus(mangaKey);
      toast.info("Status Membaca Direset", {
        description: "Status membaca untuk komik ini telah dikembalikan ke awal.",
      });
    } else {
      setReadingStatus(mangaKey, status);
      const label = STATUS_OPTIONS.find((o) => o.value === status)?.label || status;
      toast.success("Status Membaca Diperbarui", {
        description: `Komik ini ditandai sebagai "${label}".`,
      });
    }
    setIsOpen(false);
  };

  const getLabel = () => {
    if (!mounted || !readingStatus) return "Status";
    return STATUS_OPTIONS.find((o) => o.value === readingStatus)?.shortLabel || "Status";
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Atur status baca"
        className={cn(
          "flex items-center justify-center gap-1.5 h-[52px] md:h-[48px] px-1 md:px-3.5 transition-all outline-none select-none rounded-[14px] border shadow-xs active:scale-95 bg-surface-raised",
          readingStatus && mounted
            ? "border-accent/60 text-accent font-bold ring-1 ring-accent/20"
            : "border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong hover:bg-surface-hover"
        )}
      >
        <BookOpenText size={18} weight={readingStatus && mounted ? "fill" : "regular"} className="shrink-0" />
        <span className="hidden md:inline text-xs font-bold tracking-tight leading-none whitespace-nowrap">
          {getLabel()}
        </span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader className="gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-accent/30 bg-gradient-to-br from-accent/20 via-accent/10 to-transparent text-accent shadow-xs shrink-0 select-none"
              aria-hidden="true"
            >
              <BookOpenText size={22} weight="duotone" />
            </div>
            <div>
              <DialogTitle>Status Membaca</DialogTitle>
              <DialogDescription className="mt-1.5">
                Tandai progres membaca untuk komik ini.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-2 mt-1">
            {STATUS_OPTIONS.map((option) => {
              const isActive = readingStatus === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex items-center justify-between w-full p-3.5 rounded-xl transition-all border outline-none font-semibold text-sm select-none active:scale-[0.99]",
                    isActive
                      ? "bg-accent/15 border-accent/30 text-accent font-bold shadow-xs"
                      : "bg-surface-base border-border-default/60 text-text-primary hover:bg-surface-hover hover:border-border-strong"
                  )}
                >
                  <span>{option.label}</span>
                  {isActive && <span className="w-2.5 h-2.5 rounded-full bg-accent shadow-xs" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
