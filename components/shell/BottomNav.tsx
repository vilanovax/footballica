"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
    iconSrc: "/icons/memory-ball.png",
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

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useTranslation();

  // A match is "in flight" while a kick is live or its result is showing.
  const penaltyActive = usePenaltyStore(
    (s) => s.phase === "playing" || s.phase === "reveal",
  );
  const survivalActive = useSurvivalStore(
    (s) => s.phase === "playing" || s.phase === "reveal",
  );
  const matchActive = penaltyActive || survivalActive;
  const resetMatch = usePenaltyStore((s) => s.reset);
  const resetSurvival = useSurvivalStore((s) => s.reset);
  const setPaused = usePenaltyStore((s) => s.setPaused);
  const setSurvivalPaused = useSurvivalStore((s) => s.setPaused);

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

  // Warm the ranks route after first paint — highest-latency tab (DB standings).
  useEffect(() => {
    const id = window.setTimeout(() => {
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
      setPaused(true);
      setSurvivalPaused(true);
      setPendingHref(href);
      return;
    }
    handleTap();
  }

  function confirmLeave() {
    const href = pendingHref;
    setPendingHref(null);
    resetMatch();
    resetSurvival();
    playSound("click");
    if (href) router.push(href);
  }

  function cancelLeave() {
    playSound("click");
    setPaused(false);
    setSurvivalPaused(false);
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
                      "relative flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-transform",
                      "shadow-[0_4px_0_0_hsl(var(--secondary-deep)),0_8px_16px_hsl(var(--secondary)/0.45)]",
                      "active:translate-y-1 active:shadow-[0_2px_0_0_hsl(var(--secondary-deep)),0_4px_10px_hsl(var(--secondary)/0.4)]",
                      active ? "ring-2 ring-accent/70" : "",
                    ].join(" ")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={iconSrc}
                      alt=""
                      aria-hidden
                      draggable={false}
                      className="h-8 w-8 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
                    />
                    {duelInbox > 0 && (
                      <span className="absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-display text-[11px] font-bold text-accent-foreground ring-2 ring-nav">
                        {toLocaleDigits(Math.min(duelInbox, 9), locale)}
                        {duelInbox > 9 ? "+" : ""}
                      </span>
                    )}
                  </span>
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
                {/* Sliding glowing indicator behind the active tab. */}
                {active && (
                  <motion.span
                    layoutId="nav-active-glow"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-bubble bg-nav-active/10 shadow-[0_0_16px_hsl(var(--accent)/0.55)] ring-1 ring-accent/40"
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
