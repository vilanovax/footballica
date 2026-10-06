"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { LiveModeId } from "@/lib/game/economy";
import { LIVE_MODE_LABELS } from "@/lib/game/liveModes";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { playSound } from "@/lib/audio/SoundManager";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { GameCta } from "@/components/ui/game/GameCta";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { cn } from "@/lib/utils";

type DuelSpecialHelpSheetProps = {
  mode: LiveModeId | null;
  open: boolean;
  onClose: () => void;
  tone?: "default" | "dark";
};

type TFn = ReturnType<typeof useTranslation>["t"];

/**
 * Compact how-to sheet for duel specials — scannable, not a wall of text.
 */
export function DuelSpecialHelpSheet({
  mode,
  open,
  onClose,
  tone = "dark",
}: DuelSpecialHelpSheetProps) {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  if (!mode) return null;

  const title =
    locale === "fa" ? LIVE_MODE_LABELS[mode].fa : LIVE_MODE_LABELS[mode].en;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      subtitle={t("duel.help.howToPlay")}
      closeLabel={t("common.close")}
      tone={tone}
    >
      {mode === "tikiTaka" ? (
        <TikiHelpBody
          t={t}
          reduceMotion={Boolean(reduceMotion)}
          onClose={onClose}
        />
      ) : mode === "mystery" ? (
        <MysteryHelpBody
          t={t}
          reduceMotion={Boolean(reduceMotion)}
          onClose={onClose}
        />
      ) : (
        <SimpleHelpBody mode={mode} t={t} onClose={onClose} />
      )}
    </BottomSheet>
  );
}

function TikiHelpBody({
  t,
  reduceMotion,
  onClose,
}: {
  t: TFn;
  reduceMotion: boolean;
  onClose: () => void;
}) {
  const steps: { icon: string; text: string; well: string }[] = [
    {
      icon: "/icons/target.png",
      text: t("duel.help.tikiTaka.r1"),
      well: "bg-sky-500/20 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.4)]",
    },
    {
      icon: "/icons/timer.png",
      text: t("duel.help.tikiTaka.r2"),
      well: "bg-emerald-500/20 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.4)]",
    },
    {
      icon: "/icons/claim.png",
      text: t("duel.help.tikiTaka.r3"),
      well: "bg-amber-500/15 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.4)]",
    },
    {
      icon: "/icons/trophy.png",
      text: t("duel.help.tikiTaka.r4"),
      well: "bg-amber-400/15 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.45)]",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Hero — one pitch line + labeled mini board */}
      <GamePanel tone="emerald" pinstripe className="relative overflow-hidden p-3">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-s-8 top-0 h-24 w-24 rounded-full bg-emerald-400/15 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-e-6 bottom-0 h-20 w-20 rounded-full bg-sky-400/10 blur-2xl"
        />

        <div className="relative flex items-start gap-2.5">
          <GameIconWell size="md" amber src="/icons/target.png" />
          <p className="min-w-0 pt-0.5 font-display text-sm font-extrabold leading-snug text-white">
            {t("duel.help.tikiTaka.pitch")}
          </p>
        </div>

        <MiniTikiBoard
          reduceMotion={reduceMotion}
          winLabel={t("duel.help.tikiTaka.winBadge")}
        />

        <p className="relative mt-2.5 text-center font-display text-[11px] font-bold leading-snug text-emerald-100/75">
          {t("duel.help.tikiTaka.example")}
        </p>

        <div className="relative mt-2.5 flex items-center justify-center gap-3.5">
          <Swatch
            className="bg-sky-400 shadow-[0_2px_0_0_rgba(0,0,0,0.25)]"
            label={t("duel.tiki.you")}
          />
          <Swatch className="bg-white/35" label={t("duel.tiki.open")} />
          <Swatch
            className="bg-rose-400 shadow-[0_2px_0_0_rgba(0,0,0,0.25)]"
            label={t("duel.tiki.them")}
          />
        </div>
      </GamePanel>

      {/* Steps first — tip after the miss rule lands */}
      <ol className="flex flex-col gap-2">
        {steps.map((step, i) => (
          <motion.li
            key={step.text}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.2 }}
            className="flex min-h-12 items-center gap-2.5 rounded-2xl bg-black/35 px-2.5 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_3px_0_0_rgba(0,0,0,0.25)]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/8 font-display text-sm font-black tabular-nums text-white/70">
              {i + 1}
            </span>
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                step.well,
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={step.icon}
                alt=""
                draggable={false}
                className="h-6 w-6 object-contain"
              />
            </span>
            <span className="min-w-0 flex-1 font-display text-sm font-bold leading-snug text-white/92">
              {step.text}
            </span>
          </motion.li>
        ))}
      </ol>

      <div className="flex items-center gap-2.5 rounded-2xl bg-amber-400/12 px-3 py-2.5 shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_3px_0_0_rgba(0,0,0,0.2)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/streak.png"
          alt=""
          draggable={false}
          className="h-6 w-6 shrink-0 object-contain"
        />
        <p className="min-w-0 flex-1 font-display text-xs font-extrabold leading-snug text-amber-100">
          {t("duel.help.tikiTaka.tip")}
        </p>
      </div>

      <GotItButton t={t} onClose={onClose} />
    </div>
  );
}

/** Demo axes — short club names so the intersection mechanic reads instantly. */
const DEMO_COLS = ["ARS", "MCO", "FA"] as const;
const DEMO_ROWS = ["CHE", "BAR", "RMA"] as const;

function MiniTikiBoard({
  reduceMotion,
  winLabel,
}: {
  reduceMotion: boolean;
  winLabel: string;
}) {
  // Diagonal win for you — teaches 3-in-a-row at a glance.
  const cells: ("you" | "them" | "open")[] = [
    "them",
    "open",
    "you",
    "open",
    "you",
    "open",
    "you",
    "open",
    "them",
  ];
  const winIdx = new Set([2, 4, 6]);

  return (
    <div className="relative mx-auto mt-3 w-full max-w-62" aria-hidden>
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: "minmax(1.85rem,auto) repeat(3, minmax(0,1fr))",
        }}
      >
        <div />
        {DEMO_COLS.map((label) => (
          <div
            key={label}
            className="flex h-6 items-center justify-center rounded-lg bg-black/40 font-display text-[9px] font-extrabold tracking-wide text-emerald-100/80"
          >
            {label}
          </div>
        ))}
        {DEMO_ROWS.map((rowLabel, ri) => (
          <div key={rowLabel} className="contents">
            <div className="flex items-center justify-center rounded-lg bg-black/40 px-0.5 font-display text-[9px] font-extrabold tracking-wide text-emerald-100/80">
              {rowLabel}
            </div>
            {Array.from({ length: 3 }, (_, ci) => {
              const i = ri * 3 + ci;
              const kind = cells[i]!;
              const isWin = winIdx.has(i);
              return (
                <motion.div
                  key={i}
                  initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.03 * i,
                    type: "spring",
                    stiffness: 380,
                    damping: 22,
                  }}
                  className={cn(
                    "relative flex h-10 items-center justify-center rounded-xl font-display text-sm font-black",
                    kind === "you" &&
                      "bg-linear-to-br from-sky-500/60 to-blue-900/45 text-sky-50 shadow-[0_0_0_1px_rgba(56,189,248,0.55),0_2px_0_0_rgba(0,0,0,0.3)]",
                    kind === "them" &&
                      "bg-linear-to-br from-rose-500/55 to-red-950/40 text-rose-50 shadow-[0_0_0_1px_rgba(251,113,133,0.5),0_2px_0_0_rgba(0,0,0,0.3)]",
                    kind === "open" &&
                      "bg-white/4 text-white/30 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
                    isWin &&
                      "shadow-[0_0_0_2px_rgba(251,191,36,0.75),0_2px_0_0_rgba(0,0,0,0.3)]",
                  )}
                >
                  {kind === "open" ? (
                    <span className="text-base font-black text-white/25">+</span>
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
                  )}
                  {isWin ? (
                    <motion.span
                      className="pointer-events-none absolute inset-0 rounded-xl bg-amber-300/15"
                      animate={
                        reduceMotion
                          ? undefined
                          : { opacity: [0.2, 0.55, 0.2] }
                      }
                      transition={{ repeat: Infinity, duration: 1.3 }}
                    />
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="mt-2 flex justify-center"
      >
        <span className="rounded-full bg-amber-400 px-2.5 py-0.5 font-display text-[10px] font-black uppercase tracking-wide text-amber-950 shadow-[0_2px_0_0_rgba(0,0,0,0.35)]">
          {winLabel}
        </span>
      </motion.div>
    </div>
  );
}

function MysteryHelpBody({
  t,
  reduceMotion,
  onClose,
}: {
  t: TFn;
  reduceMotion: boolean;
  onClose: () => void;
}) {
  const steps = [
    { icon: "/icons/mystery.png", text: t("duel.help.mystery.r1") },
    { icon: "/icons/target.png", text: t("duel.help.mystery.r2") },
    { icon: "/icons/guesses.png", text: t("duel.help.mystery.r3") },
  ];

  return (
    <div className="flex flex-col gap-3">
      <GamePanel tone="amber" pinstripe className="relative overflow-hidden p-3">
        <div className="relative flex items-start gap-2.5">
          <GameIconWell size="md" amber src="/icons/mystery.png" />
          <p className="min-w-0 pt-0.5 font-display text-sm font-extrabold leading-snug text-white">
            {t("duel.help.mystery.pitch")}
          </p>
        </div>

        <div className="relative mt-3 grid grid-cols-3 gap-1.5">
          <LegendDemo
            className="bg-emerald-500"
            label={t("mystery.legendCorrect")}
          />
          <LegendDemo
            className="bg-amber-500"
            label={t("mystery.legendClose")}
          />
          <LegendDemo className="bg-rose-600" label={t("mystery.legendWrong")} />
          <LegendDemo
            className="bg-sky-500"
            label={`▲ ${t("mystery.legendHigher")}`}
          />
          <LegendDemo
            className="col-span-2 bg-sky-500"
            label={`▼ ${t("mystery.legendLower")}`}
          />
        </div>
      </GamePanel>

      <ol className="flex flex-col gap-2">
        {steps.map((step, i) => (
          <motion.li
            key={step.text}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.2 }}
            className="flex min-h-12 items-center gap-2.5 rounded-2xl bg-black/35 px-2.5 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_3px_0_0_rgba(0,0,0,0.25)]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/8 font-display text-sm font-black tabular-nums text-white/70">
              {i + 1}
            </span>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.4)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={step.icon}
                alt=""
                draggable={false}
                className="h-6 w-6 object-contain"
              />
            </span>
            <span className="min-w-0 flex-1 font-display text-sm font-bold leading-snug text-white/92">
              {step.text}
            </span>
          </motion.li>
        ))}
      </ol>

      <div className="rounded-2xl bg-amber-400/12 px-3 py-2.5 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]">
        <p className="font-display text-xs font-extrabold leading-snug text-amber-100">
          {t("duel.help.mystery.tip")}
        </p>
      </div>

      <GotItButton t={t} onClose={onClose} />
    </div>
  );
}

function LegendDemo({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-11 flex-col items-center justify-center rounded-xl px-1 font-display text-[10px] font-extrabold text-white shadow-[0_2px_0_0_rgba(0,0,0,0.3)]",
        className,
      )}
    >
      {label}
    </div>
  );
}

function SimpleHelpBody({
  mode,
  t,
  onClose,
}: {
  mode: LiveModeId;
  t: TFn;
  onClose: () => void;
}) {
  const lines =
    mode === "memory"
      ? [
          t("duel.help.memory.r1"),
          t("duel.help.memory.r2"),
          t("duel.help.memory.r3"),
        ]
      : [t("duel.help.generic.s1Body"), t("duel.help.generic.s2Body")];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center font-display text-sm font-bold text-white/85">
        {mode === "memory"
          ? t("duel.help.memory.pitch")
          : t("duel.help.generic.s1Title")}
      </p>
      <ul className="flex flex-col gap-2">
        {lines.map((line) => (
          <li
            key={line}
            className="rounded-2xl bg-black/35 px-3 py-3 text-center font-display text-sm font-bold text-white/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
          >
            {line}
          </li>
        ))}
      </ul>
      {mode === "memory" ? (
        <p className="text-center font-display text-xs font-extrabold text-amber-300/95">
          {t("duel.help.memory.tip")}
        </p>
      ) : null}
      <GotItButton t={t} onClose={onClose} />
    </div>
  );
}

function GotItButton({ t, onClose }: { t: TFn; onClose: () => void }) {
  return (
    <GameCta
      variant="primary"
      block
      className="mt-0.5 min-h-12"
      onClick={() => {
        playSound("click");
        haptic(HAPTIC.tap);
        onClose();
      }}
    >
      {t("duel.help.gotIt")}
    </GameCta>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-display text-[10px] font-extrabold tracking-wide text-white/60">
      <span className={cn("h-2.5 w-2.5 rounded-full", className)} />
      {label}
    </span>
  );
}
