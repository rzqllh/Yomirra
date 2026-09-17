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

const STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: "reading", label: "Sedang Dibaca" },
  { value: "completed", label: "Selesai" },
  { value: "on-hold", label: "Ditunda" },
  { value: "dropped", label: "Dihentikan" },
  { value: "plan-to-read", label: "Akan Dibaca" },
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
      toast("Status membaca dihapus");
    } else {
      setReadingStatus(mangaKey, status);
      toast.success("Status membaca diperbarui");
    }
    setIsOpen(false);
  };

  const getLabel = () => {
    if (!mounted || !readingStatus) return "Status Membaca";
    return STATUS_OPTIONS.find((o) => o.value === readingStatus)?.label || "Status Membaca";
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Atur status baca"
        className={cn(
          "w-full flex flex-col items-center justify-center gap-1.5 h-full transition-all outline-none select-none rounded-[16px] border shadow-xs active:scale-95 bg-surface-raised",
          readingStatus && mounted
            ? "border-accent/60 text-accent font-bold ring-1 ring-accent/20"
            : "border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong hover:bg-surface-hover"
        )}
      >
        <BookOpenText size={22} weight={readingStatus && mounted ? "fill" : "regular"} />
        <span className="text-[10px] font-bold tracking-tight">Status</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader className="gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/20 via-accent/10 to-transparent text-accent shadow-xs shrink-0 select-none"
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
                    "flex items-center justify-between w-full p-3.5 rounded-2xl transition-all border outline-none font-semibold text-sm select-none active:scale-[0.99]",
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
