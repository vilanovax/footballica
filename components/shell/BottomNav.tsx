"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { playSound } from "@/lib/audio/SoundManager";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { usePenaltyStore } from "@/stores/penaltyStore";
import { useSurvivalStore } from "@/stores/survivalStore";
import { getDuelInboxCount } from "@/actions/duel/getInboxCount";
import { toLocaleDigits } from "@/lib/i18n/format";
import { LeaveMatchDialog } from "@/components/quiz/LeaveMatchDialog";
import { toast } from "sonner";

const tabs = [
  {
    href: "/club",
    labelKey: "nav.club",
    iconSrc: "/icons/stadium.png",
  },
  {
    href: "/play",
    labelKey: "nav.play",
    iconSrc: "/icons/nav-ball.png",
    featured: true,
  },
  {
    href: "/leaderboard",
    labelKey: "nav.ranks",
    iconSrc: "/icons/trophy.png",
  },
  {
    href: "/profile",
    labelKey: "nav.profile",
    iconSrc: "/icons/crown.png",
  },
] as const;

function isMatchPhase(phase: string): boolean {
  return phase === "playing" || phase === "reveal";
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useTranslation();

  // Subscribe only to phase bits — actions read via getState() in handlers
  // so store action identity changes never re-render the nav chrome.
  const penaltyActive = usePenaltyStore((s) => isMatchPhase(s.phase));
  const survivalActive = useSurvivalStore((s) => isMatchPhase(s.phase));
  const matchActive = penaltyActive || survivalActive;

  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [duelInbox, setDuelInbox] = useState(0);

  // Refresh badge on route change + visibility-aware poll (pause in background).
  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    let prev =
      typeof window !== "undefined"
        ? Number(sessionStorage.getItem("fb_duel_inbox") ?? "0")
        : 0;

    async function refresh() {
      if (document.visibilityState === "hidden") return;
      const res = await getDuelInboxCount();
      if (cancelled || !res.ok) return;
      if (res.count > prev && prev >= 0) {
        const href = res.topId
          ? `/play/duel/${res.topId}`
          : "/play/duel";
        toast.message(t("duel.inboxToast", { n: String(res.count) }), {
          action: {
            label: t("duel.inboxPlayNow"),
            onClick: () => router.push(href),
          },
        });
        haptic(HAPTIC.tap);
      }
      prev = res.count;
      sessionStorage.setItem("fb_duel_inbox", String(res.count));
      setDuelInbox(res.count);
    }

    function arm() {
      window.clearTimeout(timer);
      if (cancelled || document.visibilityState === "hidden") return;
      // Slower than the old 25s tick — toast still fires on count increase.
      timer = window.setTimeout(() => {
        void refresh().finally(() => {
          if (!cancelled) arm();
        });
      }, 45_000);
    }

    void refresh().finally(() => {
      if (!cancelled) arm();
    });

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh().finally(() => {
          if (!cancelled) arm();
        });
      } else {
        window.clearTimeout(timer);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pathname, router, t]);

  // Warm hot tabs after first paint — Club (live snapshot) + ranks (DB standings).
  useEffect(() => {
    const id = window.setTimeout(() => {
      router.prefetch("/club");
      router.prefetch("/leaderboard");
    }, 800);
    return () => window.clearTimeout(id);
  }, [router]);

  // Warn before a full reload / tab close while a match is running.
  useEffect(() => {
    if (!matchActive) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [matchActive]);

  function handleTap() {
    playSound("click");
    haptic(HAPTIC.tap);
  }

  function prefetchTab(href: string) {
    router.prefetch(href);
  }

  function handleNav(e: React.MouseEvent, href: string) {
    if (matchActive) {
      // Intercept: don't lose match progress on a stray tap.
      e.preventDefault();
      haptic(HAPTIC.tap);
      usePenaltyStore.getState().setPaused(true);
      useSurvivalStore.getState().setPaused(true);
      setPendingHref(href);
      return;
    }
    handleTap();
  }

  function confirmLeave() {
    const href = pendingHref;
    setPendingHref(null);
    usePenaltyStore.getState().reset();
    useSurvivalStore.getState().reset();
    playSound("click");
    if (href) router.push(href);
  }

  function cancelLeave() {
    playSound("click");
    usePenaltyStore.getState().setPaused(false);
    useSurvivalStore.getState().setPaused(false);
    setPendingHref(null);
  }

  const leaveOpen = pendingHref !== null;

  return (
    <>
      <nav
        aria-label="Main"
        aria-hidden={leaveOpen}
        className={[
          "fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-mobile px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-opacity duration-200",
          leaveOpen ? "pointer-events-none opacity-0" : "opacity-100",
        ].join(" ")}
      >
        <div className="flex items-end justify-between gap-1 rounded-bubble-xl bg-nav/95 px-2 py-2 shadow-[0_0_0_1px_hsl(var(--arena-ring)/0.18)]">
          {tabs.map(({ href, labelKey, iconSrc, ...rest }) => {
            const label = t(labelKey);
            const featured = "featured" in rest && rest.featured;
            const active =
              pathname === href || pathname.startsWith(`${href}/`);

            if (featured) {
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch
                  onClick={(e) => handleNav(e, href)}
                  onMouseEnter={() => prefetchTab(href)}
                  onFocus={() => prefetchTab(href)}
                  onTouchStart={() => prefetchTab(href)}
                  aria-current={active ? "page" : undefined}
                  aria-label={
                    duelInbox > 0
                      ? `${label} (${duelInbox})`
                      : label
                  }
                  tabIndex={leaveOpen ? -1 : undefined}
                  className="relative -mt-6 flex min-h-touch min-w-16 flex-col items-center gap-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span
                    className={[
                      "relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full",
                      "shadow-[0_4px_0_0_rgba(0,0,0,0.4),0_0_0_2px_hsl(var(--arena-ring-amber)/0.75),0_10px_20px_hsl(var(--accent)/0.25)]",
                      "transition-transform active:translate-y-1 active:shadow-[0_2px_0_0_rgba(0,0,0,0.38),0_0_0_2px_hsl(var(--arena-ring-amber)/0.75)]",
                      active ? "ring-2 ring-accent/80" : "",
                    ].join(" ")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={iconSrc}
                      alt=""
                      aria-hidden
                      draggable={false}
                      className="h-full w-full scale-105 object-cover"
                    />
                  </span>
                  {duelInbox > 0 && (
                    <span className="absolute inset-e-1 top-0 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-display text-[11px] font-bold text-accent-foreground shadow-[0_2px_0_0_rgba(0,0,0,0.35)]">
                      {toLocaleDigits(Math.min(duelInbox, 9), locale)}
                      {duelInbox > 9 ? "+" : ""}
                    </span>
                  )}
                  <span className="font-display text-xs font-semibold text-accent">
                    {label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                prefetch
                onClick={(e) => handleNav(e, href)}
                onMouseEnter={() => prefetchTab(href)}
                onFocus={() => prefetchTab(href)}
                onTouchStart={() => prefetchTab(href)}
                aria-current={active ? "page" : undefined}
                tabIndex={leaveOpen ? -1 : undefined}
                className={[
                  "relative flex min-h-touch min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-bubble px-2 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  active
                    ? "text-nav-active"
                    : "text-nav-foreground hover:text-foreground",
                ].join(" ")}
              >
                {/* Active tab glow — CSS only (no Framer layoutId on the shell). */}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-bubble bg-nav-active/10 shadow-[0_0_16px_hsl(var(--accent)/0.55)] ring-1 ring-accent/40 animate-status-sheet-fade"
                  />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={iconSrc}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className={[
                    "relative h-6 w-6 object-contain",
                    active ? "opacity-100" : "opacity-80",
                  ].join(" ")}
                />
                <span className="relative font-display text-xs font-semibold">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <LeaveMatchDialog
        open={leaveOpen}
        onStay={cancelLeave}
        onLeave={confirmLeave}
      />
    </>
  );
}
