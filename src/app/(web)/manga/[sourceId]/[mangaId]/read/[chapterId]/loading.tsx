export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Memuat pembaca..."
      className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden select-none"
    >
      {/* Immersive Reading Canvas Minimal Loader (Zero fake pages, respects reduced motion) */}
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 rounded-full border-2 border-white/20 border-t-accent animate-spin motion-reduce:animate-none motion-reduce:border-accent" />
        <span className="text-xs font-medium text-white/50 tracking-wide font-mono">
          Memuat komik...
        </span>
      </div>
    </div>
  );
}
