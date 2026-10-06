"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { startDuel } from "@/actions/duel/startDuel";
import type { DuelSnapshot } from "@/lib/duel/snapshot";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { playSound } from "@/lib/audio/SoundManager";
import { AvatarImage } from "@/components/common/AvatarImage";
import { duelViewerOutcome } from "@/lib/duel/history";
import { viewerMatchScore } from "@/lib/duel/matchScore";
import { isDuelTerminal } from "@/lib/duel/types";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameCta } from "@/components/ui/game/GameCta";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel, type GamePanelTone } from "@/components/ui/game/GamePanel";
import { cn } from "@/lib/utils";

/** Stable default — avoid `= []` recreating referential identity each render. */
const EMPTY_HISTORY: DuelSnapshot[] = [];

type DuelLobbyProps = {
  initialDuels: DuelSnapshot[];
  initialYourTurn: DuelSnapshot[];
  /** Finished in last 24h, max 5. */
  initialHistory?: DuelSnapshot[];
  yourAvatar?: string | null;
};

type Translate = (k: string, vars?: Record<string, string | number>) => string;

type FixtureAction = "attack" | "defend" | "act" | "waiting" | "matching";

function fixtureAction(d: DuelSnapshot): FixtureAction {
  if (d.status === "MATCHING") return "matching";
  if (
    d.status === "COMPLETED" ||
    d.status === "EXPIRED" ||
    d.status === "FORFEIT"
  ) {
    return "waiting";
  }

  const yourTurn =
    d.canAct ||
    (d.status === "WAITING_A" && d.youAre === "challenger") ||
    (d.status === "WAITING_B" && d.youAre === "opponent");

  if (!yourTurn) return "waiting";
  if (d.status === "A_ATTACKING" || d.status === "B_ATTACKING") return "attack";
  if (
    d.status === "A_DEFENDING" ||
    d.status === "B_DEFENDING" ||
    d.status === "WAITING_A" ||
    d.status === "WAITING_B"
  ) {
    return "defend";
  }
  return "act";
}

function statusLabel(d: DuelSnapshot, t: Translate): string {
  if (
    d.status === "COMPLETED" ||
    d.status === "EXPIRED" ||
    d.status === "FORFEIT"
  ) {
    if (d.youTimedOut) return t("duel.expiredLose");
    const outcome = duelViewerOutcome(d);
    if (outcome === "WIN") return t("duel.outcomeWin");
    if (outcome === "LOSE") return t("duel.outcomeLose");
    if (outcome === "DRAW") return t("duel.outcomeDraw");
    return t("duel.finished");
  }
  if (d.status === "MATCHING") return t("duel.matchingBadge");

  const action = fixtureAction(d);
  if (action === "attack") return t("duel.inboxActionAttack");
  if (action === "defend") return t("duel.inboxActionDefend");
  if (action === "act") return t("duel.yourTurn");
  return t("duel.inboxWaitingRival");
}

/** Soonest deadline first — critical fixtures rise to the top. */
function byDeadlineAsc(a: DuelSnapshot, b: DuelSnapshot): number {
  const ta = a.turnDeadlineAt
    ? new Date(a.turnDeadlineAt).getTime()
    : Number.POSITIVE_INFINITY;
  const tb = b.turnDeadlineAt
    ? new Date(b.turnDeadlineAt).getTime()
    : Number.POSITIVE_INFINITY;
  return ta - tb;
}

function deadlineMeta(
  iso: string | null,
  locale: Locale,
  t: Translate,
  now: number,
): { label: string; tone: "critical" | "warn" | "ok" } | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return { label: t("duel.deadlineSoon"), tone: "critical" };
  const mins = Math.ceil(ms / 60_000);
  if (mins < 60) {
    return {
      label: t("duel.deadlineMins", { n: toLocaleDigits(mins, locale) }),
      tone: mins <= 30 ? "critical" : "warn",
    };
  }
  const h = Math.floor(mins / 60);
  return {
    label: t("duel.deadlineHours", { n: toLocaleDigits(h, locale) }),
    tone: h <= 2 ? "warn" : "ok",
  };
}

/**
 * Draft Duel lobby — Arena panels for fixtures (readable on light Play shell).
 * Compact hero + in-flow kickoff when live; full kickoff when empty.
 * Kickoff is never fixed — BottomNav owns the bottom chrome.
 */
export function DuelLobby({
  initialDuels,
  initialYourTurn,
  initialHistory = EMPTY_HISTORY,
  yourAvatar,
}: DuelLobbyProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [duels] = useState(initialDuels);
  const [yourTurn] = useState(initialYourTurn);
  const [history] = useState(initialHistory);
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  const [howToOpen, setHowToOpen] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  function handleStart() {
    if (pending) return;
    haptic(HAPTIC.tap);
    playSound("click");
    startTransition(async () => {
      const res = await startDuel();
      if (!res.ok) {
        const key =
          res.error === "no_stamina"
            ? "duel.errStamina"
            : res.error === "not_enough_categories"
              ? "duel.errCategories"
              : "duel.errGeneric";
        toast.error(t(key));
        haptic(HAPTIC.miss);
        return;
      }
      haptic(HAPTIC.goal);
      playSound("whistle");
      router.push(`/play/duel/${res.duel.id}`);
    });
  }

  const yourTurnList = yourTurn
    .filter((d) => !isDuelTerminal(d.status))
    .slice()
    .sort(byDeadlineAsc);
  const waitingList = duels
    .filter(
      (d) =>
        !isDuelTerminal(d.status) &&
        !d.canAct &&
        !yourTurnList.some((y) => y.id === d.id),
    )
    .slice()
    .sort(byDeadlineAsc);
  const finishedList = history;
  const turnCount = yourTurnList.length;
  const activeCount = yourTurnList.length + waitingList.length;
  const hasAny =
    yourTurnList.length > 0 ||
    waitingList.length > 0 ||
    finishedList.length > 0;
  /** Compact kickoff in-flow when live fixtures exist (never fixed — avoids BottomNav overlap). */
  const compactKickoff = activeCount > 0;
  const fixtureCount =
    yourTurnList.length + waitingList.length + finishedList.length;
  /** Few fixtures → center the stack so leftover pitch isn't a dead floor. */
  const centerSparse = fixtureCount > 0 && fixtureCount <= 3;

  const fixtureProps = (d: DuelSnapshot) => ({
    duel: d,
    locale,
    badge: statusLabel(d, t),
    action: fixtureAction(d),
    vsLabel: d.isBotOpponent ? t("duel.vsBot") : t("duel.vsRival"),
    youLabel: t("duel.you"),
    deadline: deadlineMeta(d.turnDeadlineAt, locale, t, now),
  });

  return (
    <section
      className={cn(
        "relative flex flex-col gap-2 pb-2",
        centerSparse &&
          "min-h-[calc(100dvh-8.25rem-env(safe-area-inset-bottom,0px))] justify-center",
      )}
    >
      {compactKickoff ? (
        <LobbyHeroWithKickoff
          turnCount={turnCount}
          activeCount={activeCount}
          locale={locale}
          pending={pending}
          yourAvatar={yourAvatar}
          onStart={handleStart}
          onHowTo={() => setHowToOpen(true)}
          startLabel={t("duel.start")}
          startingLabel={t("duel.starting")}
          anotherLabel={t("duel.lobbyFindAnother")}
          hint={t("duel.lobbyKickoffHint")}
        />
      ) : (
        <LobbyEmptyKickoff
          pending={pending}
          yourAvatar={yourAvatar}
          onStart={handleStart}
          onHowTo={() => setHowToOpen(true)}
          startLabel={t("duel.start")}
          startingLabel={t("duel.starting")}
        />
      )}

      {turnCount > 0 ? (
        <InboxSection
          title={t("duel.inboxYourTurn")}
          badge={toLocaleDigits(turnCount, locale)}
          hot
        >
          {yourTurnList.map((d, i) => (
            <FixtureCard
              key={d.id}
              {...fixtureProps(d)}
              index={i}
              urgent
            />
          ))}
        </InboxSection>
      ) : null}

      {waitingList.length > 0 ? (
        <InboxSection
          title={t("duel.inboxWaiting")}
          badge={toLocaleDigits(waitingList.length, locale)}
          hint={t("duel.waitingHint")}
        >
          {waitingList.map((d, i) => (
            <FixtureCard
              key={d.id}
              {...fixtureProps(d)}
              index={i}
              urgent={false}
              waiting
            />
          ))}
        </InboxSection>
      ) : null}

      {finishedList.length > 0 ? (
        <InboxSection
          title={t("duel.inboxFinished")}
          hint={t("duel.lobbyHistoryHint")}
        >
          {finishedList.map((d, i) => (
            <FixtureCard
              key={d.id}
              {...fixtureProps(d)}
              index={i}
              urgent={false}
              finished
            />
          ))}
        </InboxSection>
      ) : null}

      {!hasAny ? (
        <p className="px-1 text-center font-display text-[11px] font-bold text-white/50">
          {t("duel.emptyHint")}
        </p>
      ) : null}

      <BottomSheet
        open={howToOpen}
        onClose={() => setHowToOpen(false)}
        title={t("duel.lobbyHowToTitle")}
        tone="dark"
        closeLabel={t("common.close")}
      >
        <p className="font-display text-sm font-bold leading-relaxed text-white/85">
          {t("play.info.duel.rules")}
        </p>
        <p className="mt-3 font-display text-xs font-bold leading-relaxed text-white/60">
          {t("play.info.duel.tip")}
        </p>
      </BottomSheet>
    </section>
  );
}

/** One chrome block: status + find-rival — denser than stacked panels. */
function LobbyHeroWithKickoff({
  turnCount,
  activeCount,
  locale,
  pending,
  yourAvatar,
  onStart,
  onHowTo,
  startLabel,
  startingLabel,
  anotherLabel,
  hint,
}: {
  turnCount: number;
  activeCount: number;
  locale: Locale;
  pending: boolean;
  yourAvatar?: string | null;
  onStart: () => void;
  onHowTo: () => void;
  startLabel: string;
  startingLabel: string;
  anotherLabel: string;
  hint: string;
}) {
  const { t } = useTranslation();
  return (
    <GamePanel tone="amber" className="p-2.5">
      <div className="relative flex items-center gap-2">
        <GameIconWell
          size="md"
          amber
          src="/icons/trophy.png"
          className="h-10 w-10"
          iconClassName="h-5 w-5"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="truncate font-display text-[15px] font-black text-white">
              {t("duel.lobbyTitle")}
            </h1>
            <button
              type="button"
              onClick={() => {
                playSound("click");
                onHowTo();
              }}
              aria-label={t("duel.lobbyHowTo")}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-[11px] font-black text-amber-100/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]"
            >
              ؟
            </button>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            {turnCount > 0 ? (
              <GameChip
                tone="amber"
                className="gap-1 px-1.5 py-0.5 text-[10px] tracking-normal"
              >
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-accent"
                  animate={{ opacity: [1, 0.35, 1] }}
                  transition={{ repeat: Infinity, duration: 1.1 }}
                />
                {t("duel.lobbyNeedsYou", {
                  n: toLocaleDigits(turnCount, locale),
                })}
              </GameChip>
            ) : (
              <GameChip
                tone="emerald"
                className="gap-1 px-1.5 py-0.5 text-[10px]"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300/70 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                </span>
                {t("duel.lobbyAllWaiting")}
              </GameChip>
            )}
            <GameChip className="px-1.5 py-0.5 text-[10px] tabular-nums">
              {toLocaleDigits(activeCount, locale)} {t("duel.lobbyActive")}
            </GameChip>
          </div>
        </div>
      </div>

      <div className="relative mt-2 flex items-center gap-2 border-t border-white/10 pt-2">
        <div className="flex shrink-0 items-center -space-x-2 rtl:space-x-reverse">
          <AvatarRing size="sm" avatarKey={yourAvatar} />
          <AvatarRing size="sm" mystery />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[13px] font-black text-white">
            {anotherLabel}
          </p>
          <p className="truncate font-display text-[10px] font-bold text-amber-100/65">
            {hint}
          </p>
        </div>
        <GameCta
          variant="accent"
          disabled={pending}
          onClick={onStart}
          className="min-h-11 shrink-0 px-3 text-[13px]"
        >
          {pending ? startingLabel : startLabel}
        </GameCta>
      </div>
    </GamePanel>
  );
}

/** Empty lobby — one composition: title + VS + kickoff (survival-style). */
function LobbyEmptyKickoff({
  pending,
  yourAvatar,
  onStart,
  onHowTo,
  startLabel,
  startingLabel,
}: {
  pending: boolean;
  yourAvatar?: string | null;
  onStart: () => void;
  onHowTo: () => void;
  startLabel: string;
  startingLabel: string;
}) {
  const { t } = useTranslation();
  return (
    <GamePanel tone="amber" className="relative overflow-hidden p-3.5">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-e-10 -top-8 h-28 w-28 rounded-full bg-amber-300/25 blur-3xl"
      />
      <div className="relative flex items-start gap-3">
        <GameIconWell
          size="md"
          amber
          src="/icons/trophy.png"
          className="h-12 w-12"
          iconClassName="h-7 w-7"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-display text-[11px] font-black text-amber-100/80">
              {t("duel.eyebrow")}
            </p>
            <button
              type="button"
              onClick={() => {
                playSound("click");
                onHowTo();
              }}
              aria-label={t("duel.lobbyHowTo")}
              className="font-display text-[10px] font-black text-sky-200 underline-offset-2 hover:underline"
            >
              ؟
            </button>
          </div>
          <h1 className="mt-0.5 font-display text-2xl font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
            {t("duel.lobbyTitle")}
          </h1>
          <p className="mt-1 font-display text-xs font-bold leading-snug text-white/70">
            {t("duel.lobbyHook")}
          </p>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-center gap-4">
        <AvatarRing pulse avatarKey={yourAvatar} />
        <motion.span className="rounded-full bg-accent px-3 py-1 font-display text-sm font-black text-accent-foreground shadow-[0_3px_0_0_hsl(var(--accent-deep))]">
          VS
        </motion.span>
        <AvatarRing mystery />
      </div>

      <div className="relative mt-3 flex flex-wrap items-center justify-center gap-1.5">
        <GameChip className="gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/energy.png"
            alt=""
            draggable={false}
            className="h-3.5 w-3.5 object-contain"
          />
          {t("duel.chipEnergy")}
        </GameChip>
        <GameChip className="gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/timer.png"
            alt=""
            draggable={false}
            className="h-3.5 w-3.5 object-contain"
          />
          {t("duel.chipTurn")}
        </GameChip>
      </div>

      <GameCta
        variant="accent"
        block
        disabled={pending}
        onClick={onStart}
        className="relative mt-3.5 min-h-14 text-base"
      >
        <AnimatePresence mode="wait">
          {pending ? (
            <motion.span
              key="load"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 0.8,
                  ease: "linear",
                }}
                aria-hidden
                className="inline-flex"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/memory-ball.png"
                  alt=""
                  className="h-5 w-5 object-contain"
                />
              </motion.span>
              {startingLabel}
            </motion.span>
          ) : (
            <motion.span
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/energy.png"
                alt=""
                aria-hidden
                className="h-5 w-5 object-contain"
              />
              {startLabel}
            </motion.span>
          )}
        </AnimatePresence>
      </GameCta>
      <p className="relative mt-2 text-center font-display text-[11px] font-bold text-white/55">
        {t("duel.lobbyKickoffHint")}
      </p>
    </GamePanel>
  );
}

function InboxSection({
  title,
  badge,
  hot,
  hint,
  children,
}: {
  title: string;
  badge?: string;
  hot?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2
              className={cn(
                "font-display text-[13px] font-black",
                hot ? "text-amber-200" : "text-white/85",
              )}
            >
              {title}
            </h2>
            {badge ? (
              <GameChip
                tone={hot ? "amber" : "emerald"}
                className="min-h-5 min-w-5 justify-center px-1.5 py-0 text-[10px] tabular-nums text-white"
              >
                {badge}
              </GameChip>
            ) : null}
          </div>
          {hint ? (
            <p className="mt-0.5 font-display text-[10px] font-bold text-white/50">
              {hint}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function AvatarRing({
  pulse,
  mystery,
  avatarKey,
  size = "md",
}: {
  pulse?: boolean;
  mystery?: boolean;
  avatarKey?: string | null;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-9 w-9" : "h-14 w-14";
  const ring = size === "sm" ? "ring-2" : "ring-4";

  return (
    <div className="relative">
      {pulse && (
        <motion.span
          className="absolute inset-0 rounded-full bg-amber-300/40"
          animate={{ scale: [1, 1.28], opacity: [0.55, 0] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        />
      )}
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-full shadow-[0_3px_0_0_rgba(0,0,0,0.35)]",
          dim,
          ring,
          mystery
            ? "bg-white/10 ring-white/25"
            : "bg-white/10 ring-amber-300/55",
        )}
      >
        {mystery ? (
          <motion.span
            className={cn(
              "font-display font-black text-white/60",
              size === "sm" ? "text-lg" : "text-2xl",
            )}
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            ?
          </motion.span>
        ) : (
          <AvatarImage avatarKey={avatarKey} className={`${dim} rounded-full`} />
        )}
      </div>
    </div>
  );
}

function FixtureCard({
  duel: d,
  index,
  locale,
  badge,
  action,
  urgent,
  waiting,
  finished,
  vsLabel,
  youLabel,
  deadline,
}: {
  duel: DuelSnapshot;
  index: number;
  locale: Locale;
  badge: string;
  action: FixtureAction;
  urgent: boolean;
  waiting?: boolean;
  finished?: boolean;
  vsLabel: string;
  youLabel: string;
  deadline?: { label: string; tone: "critical" | "warn" | "ok" } | null;
}) {
  const { t } = useTranslation();
  const { you, them } = viewerMatchScore(d);
  const youParty =
    d.youAre === "challenger" ? d.challenger : d.opponent;
  const themParty =
    d.youAre === "challenger" ? d.opponent : d.challenger;
  const isFinished =
    finished ||
    d.status === "COMPLETED" ||
    d.status === "EXPIRED" ||
    d.status === "FORFEIT";
  const outcome = isFinished ? duelViewerOutcome(d) : null;
  const themLost = outcome === "WIN";
  const critical = urgent && deadline?.tone === "critical";

  const panelTone: GamePanelTone = urgent
    ? "amber"
    : waiting
      ? "sky"
      : outcome === "WIN"
        ? "emerald"
        : outcome === "LOSE"
          ? "rose"
          : "emerald";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(0.16, 0.03 + index * 0.03) }}
    >
      <Link
        href={`/play/duel/${d.id}`}
        className="group block"
        aria-label={
          urgent
            ? `${t("duel.inboxPlayCta")} — ${themParty?.name ?? vsLabel}`
            : undefined
        }
        onClick={() => {
          playSound("click");
          haptic(HAPTIC.tap);
        }}
      >
        <GamePanel
          tone={panelTone}
          className={cn(
            "flex min-h-14 items-center gap-2.5 bg-black/35 px-2.5 py-2 transition-transform active:scale-[0.985]",
            urgent && "ring-1 ring-arena-amber/70",
            critical && "shadow-[0_0_16px_rgba(244,63,94,0.3)] ring-rose-400/55",
            isFinished && "opacity-90",
          )}
        >
          {urgent ? (
            <motion.span
              aria-hidden
              className={cn(
                "absolute inset-y-1.5 inset-s-0 w-1 rounded-full",
                critical ? "bg-rose-400" : "bg-accent",
              )}
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{ repeat: Infinity, duration: 1.35 }}
            />
          ) : null}

          <div className="relative flex shrink-0 items-center -space-x-2 ps-1 rtl:space-x-reverse">
            <AvatarImage
              avatarKey={youParty?.avatar}
              className="h-9 w-9 rounded-full ring-2 ring-sky-300/65"
              muted={!youParty?.avatar}
            />
            <div className="relative z-1">
              <AvatarImage
                avatarKey={themParty?.avatar}
                className={cn(
                  "h-9 w-9 rounded-full ring-2",
                  urgent ? "ring-amber-300/70" : "ring-white/25",
                )}
                muted={!themParty?.avatar || themLost}
              />
              {d.isBotOpponent && !d.shadowBotActive ? (
                <span className="absolute -bottom-0.5 -inset-e-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 font-display text-[7px] font-black text-accent-foreground shadow-sm ring-1 ring-arena">
                  BOT
                </span>
              ) : null}
            </div>
          </div>

          <div className="relative min-w-0 flex-1 text-start">
            <div className="flex items-center gap-1.5">
              <p className="min-w-0 truncate font-display text-[13px] font-black leading-tight text-white">
                {themParty?.name ?? vsLabel}
              </p>
              <span
                dir="ltr"
                className="shrink-0 rounded-md bg-black/40 px-1.5 py-0.5 font-display text-[11px] font-black tabular-nums text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
              >
                {toLocaleDigits(you, locale)}
                <span className="text-white/40">–</span>
                {toLocaleDigits(them, locale)}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-1">
              <StatusChip
                action={action}
                urgent={urgent}
                waiting={Boolean(waiting)}
                outcome={outcome}
                label={badge}
              />
              {deadline && !isFinished ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-display text-[10px] font-bold",
                    deadline.tone === "critical"
                      ? "bg-rose-500/35 text-rose-50 shadow-[inset_0_0_0_1px_rgba(251,113,133,0.45)]"
                      : deadline.tone === "warn"
                        ? "bg-amber-500/25 text-amber-50 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.35)]"
                        : "bg-black/35 text-white/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/timer.png"
                    alt=""
                    className="h-3 w-3 object-contain opacity-90"
                    draggable={false}
                  />
                  {deadline.label}
                </span>
              ) : isFinished ? (
                <span className="truncate font-display text-[10px] font-bold text-white/50">
                  {youLabel}
                  {youParty?.name ? ` · ${youParty.name}` : ""}
                </span>
              ) : null}
            </div>
          </div>

          {urgent ? (
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[0_3px_0_0_hsl(var(--accent-deep))] transition-transform group-active:translate-y-0.5 group-active:shadow-[0_1px_0_0_hsl(var(--accent-deep))]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/target.png"
                alt=""
                aria-hidden
                className="h-5 w-5 object-contain"
                draggable={false}
              />
            </span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/icons/back.png"
              alt=""
              aria-hidden
              className="relative h-4 w-4 shrink-0 object-contain opacity-45 transition-transform group-active:-translate-x-0.5 rtl:rotate-180"
            />
          )}
        </GamePanel>
      </Link>
    </motion.div>
  );
}

/** Status chip — attack/defend tones differ from the play CTA. */
function StatusChip({
  action,
  urgent,
  waiting,
  outcome,
  label,
}: {
  action: FixtureAction;
  urgent: boolean;
  waiting: boolean;
  outcome: "WIN" | "LOSE" | "DRAW" | null;
  label: string;
}) {
  if (urgent && action === "attack") {
    return (
      <span className="inline-flex items-center rounded-md bg-orange-500/40 px-1.5 py-0.5 font-display text-[10px] font-black text-orange-50 shadow-[inset_0_0_0_1px_rgba(251,146,60,0.55)]">
        {label}
      </span>
    );
  }
  if (urgent && action === "defend") {
    return (
      <span className="inline-flex items-center rounded-md bg-sky-500/35 px-1.5 py-0.5 font-display text-[10px] font-black text-sky-50 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.5)]">
        {label}
      </span>
    );
  }
  if (urgent) {
    return (
      <span className="inline-flex items-center rounded-md bg-accent/90 px-1.5 py-0.5 font-display text-[10px] font-black text-accent-foreground shadow-[0_2px_0_0_hsl(var(--accent-deep))]">
        {label}
      </span>
    );
  }
  if (waiting) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-black/45 px-1.5 py-0.5 font-display text-[10px] font-black text-sky-100 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.45)]">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-300" aria-hidden />
        {label}
      </span>
    );
  }
  if (outcome === "WIN") {
    return (
      <span className="inline-flex items-center rounded-md bg-emerald-500/30 px-1.5 py-0.5 font-display text-[10px] font-black text-emerald-100 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.5)]">
        {label}
      </span>
    );
  }
  if (outcome === "LOSE") {
    return (
      <span className="inline-flex items-center rounded-md bg-rose-500/30 px-1.5 py-0.5 font-display text-[10px] font-black text-rose-100 shadow-[inset_0_0_0_1px_rgba(251,113,133,0.5)]">
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-black/40 px-1.5 py-0.5 font-display text-[10px] font-black text-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]">
      {label}
    </span>
  );
}
