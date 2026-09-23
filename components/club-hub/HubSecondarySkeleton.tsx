type HubSecondarySkeletonProps = {
  /** When false, parent owns the loading announcement (e.g. ClubHubSkeleton). */
  announce?: boolean;
};

/**
 * Compact pulse placeholders while Club secondary rails stream.
 * Order matches live rails: duel urgency → missions → today.
 */
export function HubSecondarySkeleton({
  announce = true,
}: HubSecondarySkeletonProps) {
  return (
    <div
      className="flex flex-col gap-2"
      role={announce ? "status" : undefined}
      aria-busy={announce ? true : undefined}
      aria-label={announce ? "Loading hub activity" : undefined}
      aria-hidden={announce ? undefined : true}
    >
      <div className="h-14 animate-pulse rounded-bubble-xl bg-[hsl(var(--arena-mid)/0.5)] shadow-[0_0_0_1px_hsl(var(--arena-ring)/0.12)]" />
      <div className="h-30 animate-pulse rounded-bubble-xl bg-[hsl(var(--arena-mid)/0.55)] shadow-[0_0_0_1px_hsl(var(--arena-ring)/0.12)]" />
      <div className="grid grid-cols-2 gap-1.5">
        <div className="h-14 animate-pulse rounded-bubble-xl bg-[hsl(var(--arena-mid)/0.45)]" />
        <div className="h-14 animate-pulse rounded-bubble-xl bg-[hsl(var(--arena-mid)/0.45)]" />
      </div>
      {announce ? <span className="sr-only">Loading</span> : null}
    </div>
  );
}
