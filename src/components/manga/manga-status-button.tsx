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
        aria-label="Ubah status membaca"
        className={cn(
          "flex-1 flex flex-col items-center justify-center gap-1.5 h-full transition-colors outline-none select-none hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10",
          readingStatus && mounted ? "text-accent" : "text-text-secondary hover:text-text-primary"
        )}
      >
        <BookOpenText size={24} weight={readingStatus && mounted ? "fill" : "regular"} />
        <span className="text-[11px] font-bold tracking-tight">Status</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-surface-overlay/95 backdrop-blur-xl shadow-default -heavy">
          <DialogHeader>
            <DialogTitle>Status Membaca</DialogTitle>
            <DialogDescription>
              Tandai progress membaca untuk manga ini.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-2 mt-4">
            {STATUS_OPTIONS.map((option) => {
              const isActive = readingStatus === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex items-center justify-between w-full p-3 rounded-xl transition-all border outline-none",
                    isActive
                      ? "bg-accent/10 border-accent/20 text-accent font-bold"
                      : "bg-surface-base border-border-strong text-text-primary hover:bg-surface-hover hover:border-border-default font-medium"
                  )}
                >
                  {option.label}
                  {isActive && <span className="w-2 h-2 rounded-full bg-accent" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
