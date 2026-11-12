export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Memuat pembaca..."
      className="min-h-screen bg-surface-base flex flex-col items-center justify-center relative overflow-hidden select-none"
    >
      {/* Immersive Reading Canvas Minimal Loader (Zero fake pages, respects reduced motion) */}
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 rounded-full border-2 border-border-default border-t-accent animate-spin motion-reduce:animate-none motion-reduce:border-accent" />
        <span className="text-xs font-medium text-text-muted tracking-wide font-mono">
          Memuat komik...
        </span>
      </div>
    </div>
  );
}
