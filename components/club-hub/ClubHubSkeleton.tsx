import { GamePanel } from "@/components/ui/game/GamePanel";
import { HubSecondarySkeleton } from "@/components/club-hub/HubSecondarySkeleton";

const bone = "animate-pulse rounded-full bg-white/15";
const block =
  "animate-pulse rounded-bubble-xl bg-[hsl(var(--arena-mid)/0.55)] shadow-[0_0_0_1px_hsl(var(--arena-ring)/0.12)]";

/**
 * Layout-matched Club Hub fallback — HUD + MatchDoor + rails + stadium
 * silhouette. CSS-only (no Framer) so `loading.tsx` stays lean.
 */
export function ClubHubSkeleton() {
  return (
    <section
      className="relative flex flex-1 flex-col"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading Club Hub"
    >
      <div className="flex flex-col gap-2">
        {/* HUD — mirrors ClubHub GamePanel header + StatusBar */}
        <GamePanel tone="emerald" className="p-2.5">
          <header className="relative flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-white/20 shadow-[0_3px_0_0_rgba(0,0,0,0.35)]"
                aria-hidden
              />
              <div className={`h-5 w-28 ${bone}`} aria-hidden />
            </div>
            <div
              className="flex h-11 w-30 shrink-0 animate-pulse rounded-2xl bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_3px_0_0_rgba(0,0,0,0.28)]"
              aria-hidden
            />
          </header>
          <div className="relative mt-2.5 flex gap-2" aria-hidden>
            <div className="h-9 flex-1 animate-pulse rounded-2xl bg-black/25" />
            <div className="h-9 flex-1 animate-pulse rounded-2xl bg-black/25" />
          </div>
        </GamePanel>

        {/* MatchDoor silhouette */}
        <GamePanel tone="amber" className="flex flex-col gap-3 p-3.5">
          <div className="flex items-center gap-2" aria-hidden>
            <div className="h-5 w-24 animate-pulse rounded-full bg-black/25" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-black/20" />
          </div>
          <div className="flex items-center gap-3" aria-hidden>
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-black/30" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="h-5 w-36 animate-pulse rounded-full bg-white/20" />
              <div className="h-3 w-44 animate-pulse rounded-full bg-white/10" />
            </div>
          </div>
          <div
            className="h-12 w-full animate-pulse rounded-bubble-xl bg-accent/35 shadow-[0_3px_0_0_rgba(0,0,0,0.28)]"
            aria-hidden
          />
          <div className="h-3 w-3/5 animate-pulse rounded-full bg-white/10" aria-hidden />
        </GamePanel>

        <HubSecondarySkeleton announce={false} />

        {/* Stadium block */}
        <div className="relative">
          <div className={`mb-1 h-3 w-24 ${bone}`} aria-hidden />
          <div className={`h-36 w-full ${block}`} aria-hidden />
        </div>
      </div>

      <span className="sr-only">Loading Club Hub</span>
    </section>
  );
}
