/**
 * Streaming fallback for the Game of the Day card on /play.
 * CSS pulse only — no Framer — so the shell paints cheaply.
 */
export function GotdSkeleton() {
  return (
    <div
      className="relative overflow-hidden rounded-bubble-xl bg-linear-to-br from-amber-950/80 via-arena to-arena-deep p-3.5 shadow-arena-ring-amber"
      role="status"
      aria-busy="true"
      aria-label="Loading game of the day"
    >
      <div className="flex flex-col gap-3">
        <div className="h-3 w-24 animate-pulse rounded-full bg-white/15" />
        <div className="h-6 w-3/5 animate-pulse rounded-full bg-white/20" />
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-white/10" />
        <div className="mt-1 h-12 animate-pulse rounded-2xl bg-white/10" />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
