import { useState } from "react";
import { Star } from "@phosphor-icons/react";
import { useLibraryStore } from "@/shared/store/library-store";
import { useAuth } from "@/shared/hooks/use-auth";
import { GuestActionGateModal } from "@/components/auth/guest-action-gate-modal";
import { cn } from "@/shared/utils/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMounted } from "@/shared/hooks/use-mounted";
import { toast } from "sonner";

interface MangaRatingProps {
  sourceId: string;
  mangaId: string;
  variant?: "default" | "action";
  className?: string;
  mangaDetail?: {
    title: string;
    coverUrl?: string;
    author?: string;
    status?: string;
  };
}

export function MangaRating({ sourceId, mangaId, className, variant = "default", mangaDetail }: MangaRatingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [pendingRating, setPendingRating] = useState<number | null>(null);

  const { user } = useAuth();
  const getLibraryItem = useLibraryStore(state => state.getLibraryItem);
  const updateLibraryItem = useLibraryStore(state => state.updateLibraryItem);
  
  const libraryItem = getLibraryItem(sourceId, mangaId);
  const mounted = useMounted();
  const userRating = mounted ? libraryItem?.userRating : undefined;

  const onSelectRating = (rating: number) => {
    // If removing rating, proceed without gate
    if (rating === userRating) {
      handleRating(rating);
      return;
    }

    // If guest, trigger soft-nudge modal
    if (!user) {
      setPendingRating(rating);
      setIsOpen(false);
      setIsGateOpen(true);
      return;
    }

    handleRating(rating);
  };

  const handleProceedGuest = () => {
    if (pendingRating !== null) {
      handleRating(pendingRating);
      setPendingRating(null);
    }
  };

  const handleLoginSuccess = () => {
    if (pendingRating !== null) {
      handleRating(pendingRating);
      setPendingRating(null);
    }
  };

  const handleRating = (rating: number) => {
    const libraryStore = useLibraryStore.getState();
    if (!libraryStore.isInLibrary(sourceId, mangaId)) {
      libraryStore.addToLibrary({
        sourceId,
        mangaId,
        title: mangaDetail?.title || "Manga",
        coverUrl: mangaDetail?.coverUrl || "",
        author: mangaDetail?.author,
        status: mangaDetail?.status,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success("Otomatis disimpan ke Rak Buku");
    }
    updateLibraryItem(sourceId, mangaId, { userRating: rating === userRating ? undefined : rating });
    if (rating !== userRating) {
      toast.success(`Rating ${rating}/10 disimpan`);
    } else {
      toast.error("Rating dihapus");
    }
    setIsOpen(false);
  };

  const triggerButton = variant === "action" ? (
    <button
      onClick={() => setIsOpen(true)}
      aria-label="Beri Rating"
      className={cn(
        "flex items-center justify-center gap-2 min-h-[44px] px-4 transition-all outline-none select-none rounded-[14px] border shadow-xs active:scale-95 bg-surface-raised",
        userRating && mounted
          ? "border-accent/60 text-accent font-bold ring-1 ring-accent/20"
          : "border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong hover:bg-surface-hover"
      )}
    >
      <Star size={18} weight={userRating && mounted ? "fill" : "regular"} />
      <span className="text-[11px] font-bold tracking-tight">
        {userRating && mounted ? `${userRating}/10` : "Rating"}
      </span>
    </button>
  ) : (
    <button 
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
        userRating ? "text-accent bg-accent/10 font-bold" : "text-text-muted hover:text-text-primary hover:bg-surface-hover font-medium",
        className
      )}
      title="Beri rating"
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
      <DropdownMenuContent align="start" className="w-[280px] p-4 bg-surface-overlay/95 backdrop-blur-xl border-border-default shadow-heavy rounded-xl">
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
                onClick={() => onSelectRating(rating)}
                className={cn(
                  "flex items-center justify-center h-10 rounded-lg text-sm font-bold transition-all duration-200",
                  userRating === rating 
                    ? "bg-accent text-white ring-1 ring-accent/30" 
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

      <GuestActionGateModal
        isOpen={isGateOpen}
        onOpenChange={setIsGateOpen}
        actionType="rating"
        titleContext={pendingRating ? `${pendingRating}/10` : undefined}
        onProceedAsGuest={handleProceedGuest}
        onLoginSuccess={handleLoginSuccess}
      />
    </DropdownMenu>
  );
}
