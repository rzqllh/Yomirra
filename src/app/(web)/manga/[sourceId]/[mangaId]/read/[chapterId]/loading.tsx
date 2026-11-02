import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-start relative overflow-hidden select-none">
      {/* Immersive Reading Canvas Placeholder (Controls remain hidden per reader design) */}
      <div className="w-full flex flex-col items-center py-6 px-2 sm:px-4">
        <div className="w-full max-w-[var(--reader-page-max-width,720px)] flex flex-col gap-3 items-center">
          <Skeleton className="w-full aspect-[2/3] bg-white/5 border border-white/5 rounded-xs" />
          <Skeleton className="w-full aspect-[2/3] bg-white/5 border border-white/5 rounded-xs" />
        </div>
      </div>
    </div>
  );
}
