import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Top Header Skeleton */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-md flex items-center justify-between px-4 z-10 border-b border-white/10">
        <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-4 w-32 bg-white/10" />
          <Skeleton className="h-3 w-20 bg-white/10" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
      </div>

      {/* Main Reading Area Skeleton */}
      <div className="w-full h-full flex flex-col items-center pt-16">
        <div className="w-full md:max-w-3xl flex-1 flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className={`w-full bg-white/5 rounded-none ${i === 0 ? 'h-[60vh]' : 'h-[40vh]'}`} />
          ))}
        </div>
      </div>

      {/* Bottom Nav Skeleton */}
      <div className="absolute bottom-0 left-0 right-0 h-[calc(env(safe-area-inset-bottom)+80px)] bg-black/80 backdrop-blur-md z-10 border-t border-white/10 flex flex-col justify-center px-4">
        <div className="flex items-center justify-between max-w-md mx-auto w-full">
           <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
           <div className="flex-1 px-8">
             <Skeleton className="h-2 w-full rounded-full bg-white/10" />
           </div>
           <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}
