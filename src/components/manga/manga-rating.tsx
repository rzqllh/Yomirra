import { useState, useTransition } from "react";
import { Star } from "@phosphor-icons/react";
import { useLibraryStore } from "@/shared/store/library-store";
import { cn } from "@/shared/utils/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMounted } from "@/shared/hooks/use-mounted";

interface MangaRatingProps {
  sourceId: string;
  mangaId: string;
  variant?: "default" | "action";
  className?: string;
}

export function MangaRating({ sourceId, mangaId, className, variant = "default" }: MangaRatingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const getLibraryItem = useLibraryStore(state => state.getLibraryItem);
  const updateLibraryItem = useLibraryStore(state => state.updateLibraryItem);
  
  const libraryItem = getLibraryItem(sourceId, mangaId);
  const mounted = useMounted();
  const userRating = mounted ? libraryItem?.userRating : undefined;

  const isInLibrary = mounted ? !!libraryItem : false;

  const handleRating = (rating: number) => {
    if (!isInLibrary) return;
    updateLibraryItem(sourceId, mangaId, { userRating: rating === userRating ? undefined : rating });
    setIsOpen(false);
  };

  const triggerButton = variant === "action" ? (
    <button 
      className={cn(
        "flex-1 flex flex-col items-center justify-center gap-1.5 h-full transition-colors outline-none select-none hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10",
        userRating ? "text-amber-500" : "text-text-secondary hover:text-text-primary",
        !isInLibrary && "opacity-40 cursor-not-allowed"
      )}
      disabled={!mounted || !isInLibrary}
    >
      <Star size={24} weight={userRating ? "fill" : "regular"} />
      <span className="text-[11px] font-bold tracking-tight">
        {userRating ? `${userRating}/10` : "Rating"}
      </span>
    </button>
  ) : (
    <button 
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
        userRating ? "text-amber-400 bg-amber-400/10 font-bold" : "text-text-muted hover:text-text-primary hover:bg-surface-hover font-medium",
        !isInLibrary && "opacity-50 cursor-not-allowed",
        className
      )}
      title={!isInLibrary ? "Tambahkan ke library untuk memberi rating" : "Beri rating"}
      disabled={!mounted || !isInLibrary}
    >
      <Star size={16} weight={userRating ? "fill" : "bold"} />
      <span className="text-sm">{userRating || "Rating"}</span>
    </button>
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {triggerButton}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px] p-4 bg-surface-overlay/95 backdrop-blur-xl border-border-default shadow-heavy rounded-2xl">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-text-primary">Beri Rating</span>
            {userRating && (
              <button 
                onClick={() => handleRating(userRating)}
                className="text-xs text-semantic-error hover:underline font-medium"
              >
                Hapus
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
              <button
                key={rating}
                onClick={() => handleRating(rating)}
                className={cn(
                  "flex items-center justify-center h-10 rounded-lg text-sm font-bold transition-all duration-200",
                  userRating === rating 
                    ? "bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]" 
                    : "bg-surface-raised text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                )}
              >
                {rating}
              </button>
            ))}
          </div>
          
          <p className="text-xs text-text-muted text-center mt-1">
            {userRating ? `Kamu memberi rating ${userRating}/10` : "Pilih dari 1 hingga 10"}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
