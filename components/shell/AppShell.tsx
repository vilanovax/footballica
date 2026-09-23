"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/shell/BottomNav";
import { Toaster } from "@/components/ui/sonner";

type AppShellProps = {
  children: React.ReactNode;
};

/**
 * Mobile-first App Shell — main content + fixed bottom navigation.
 * Constrained to max-w-mobile to avoid desktop stretch / horizontal scroll.
 *
 * The `/admin` CMS is a full-width, desktop-first surface and deliberately
 * opts out of the game chrome (no mobile frame, no bottom nav).
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAdmin = Boolean(pathname?.startsWith("/admin"));

  useEffect(() => {
    document.documentElement.classList.toggle("player-pitch", !isAdmin);
    return () => document.documentElement.classList.remove("player-pitch");
  }, [isAdmin]);

  if (isAdmin) {
    return <>{children}</>;
  }

  const bareChrome =
    pathname === "/login" || pathname?.startsWith("/onboarding");
  const onboardingMood = pathname?.startsWith("/onboarding");
  const immersivePlay = isImmersivePlayRoute(pathname);
  const fullBleedMood = isFullBleedMoodRoute(pathname);
  const hideNav = bareChrome || immersivePlay;

  return (
    <div className="hub-ground min-h-dvh w-full">
      <div
        className={[
          "relative mx-auto flex min-h-dvh w-full max-w-mobile flex-col overflow-x-hidden",
          onboardingMood || fullBleedMood
            ? "bg-[hsl(var(--arena-bg))]"
            : "",
        ].join(" ")}
      >
        <main
          className={[
            "flex flex-1 flex-col",
            fullBleedMood
              ? "px-0 pt-0 pb-0"
              : [
                  "px-4 pt-[max(1rem,env(safe-area-inset-top))]",
                  hideNav
                    ? immersivePlay
                      ? "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
                      : "pb-8"
                    : "pb-[calc(7.75rem+env(safe-area-inset-bottom,0px))]",
                ].join(" "),
          ].join(" ")}
        >
          {children}
        </main>
        {!hideNav && <BottomNav />}
        <Toaster tone="arena" position="top-center" />
      </div>
    </div>
  );
}

/** Active arenas where chrome would break immersion. */
function isImmersivePlayRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/play/penalty")) return true;
  if (pathname.startsWith("/play/survival")) return true;
  // Duel detail only — lobby keeps nav.
  if (/^\/play\/duel\/[^/]+/.test(pathname)) return true;
  return false;
}

/**
 * Arenas that paint edge-to-edge dark (no shell inset).
 * Solo GotD routes redirect to Duel — no full-bleed needed here.
 */
function isFullBleedMoodRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return false;
}
