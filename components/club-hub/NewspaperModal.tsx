"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { NewsPayload, NewsState } from "@/actions/claimDailyNews";
import {
  BOOSTER_DURATION_HOURS,
  formatMultiplier,
} from "@/lib/boosters/boosters";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { playSound } from "@/lib/audio/SoundManager";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { cn } from "@/lib/utils";

type NewspaperModalProps = {
  news: NewsPayload | null;
  state: NewsState;
  onClaim: () => void;
};

const PAPER = {
  front: "#f6efe0",
  mid: "#efe6d2",
  back: "#e6dcc4",
  ink: "#1c1914",
  rule: "rgba(28,25,20,0.18)",
} as const;

function editionDate(locale: Locale): string {
  try {
    return new Date().toLocaleDateString(locale === "fa" ? "fa-IR" : "en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

/** Diegetic paper sheet — cream press, not Arena chrome (DESIGN exception). */
function PaperSheet({
  children,
  ariaLabel,
  dismissLabel,
  onDismiss,
}: {
  children: ReactNode;
  ariaLabel: string;
  dismissLabel: string;
  onDismiss: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-70 mx-auto flex max-w-mobile items-center justify-center px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label={dismissLabel}
        onClick={onDismiss}
        className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
      />

      {/* Desk shadow under the stack */}
      <div
        aria-hidden
        className="pointer-events-none absolute h-8 w-[min(88%,17.5rem)] translate-y-[min(13.5rem,42vh)] rounded-full bg-black/40 blur-2xl"
      />

      {/* Back sheets — staggered fold */}
      <motion.div
        aria-hidden
        initial={reduceMotion ? false : { opacity: 0, y: 18, rotate: 6 }}
        animate={{ opacity: 1, y: 0, rotate: 3.25 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.02 }}
        className="pointer-events-none absolute h-[min(30rem,80vh)] w-[min(100%,20.25rem)] translate-x-1.5 translate-y-3 rounded-[1.4rem]"
        style={{
          background: PAPER.back,
          boxShadow: "0 14px 32px rgba(0,0,0,0.32)",
        }}
      />
      <motion.div
        aria-hidden
        initial={reduceMotion ? false : { opacity: 0, y: 14, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -1.75 }}
        transition={{ type: "spring", stiffness: 210, damping: 18, delay: 0.05 }}
        className="pointer-events-none absolute h-[min(30rem,80vh)] w-[min(100%,20.25rem)] -translate-x-1 translate-y-1.5 rounded-[1.4rem]"
        style={{
          background: PAPER.mid,
          boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
        }}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        initial={
          reduceMotion
            ? { opacity: 0, y: 16 }
            : { opacity: 0, y: 56, scale: 0.92, rotate: -8 }
        }
        animate={{ opacity: 1, y: 0, scale: 1, rotate: -0.6 }}
        exit={
          reduceMotion
            ? { opacity: 0, y: 10 }
            : { opacity: 0, y: 28, scale: 0.94, rotate: 4 }
        }
        transition={{ type: "spring", stiffness: 280, damping: 22, mass: 0.9 }}
        className="relative w-full max-w-xs overflow-hidden rounded-[1.4rem] text-center shadow-[0_0_0_1px_rgba(0,0,0,0.14),0_22px_48px_rgba(0,0,0,0.4)]"
        style={{ background: PAPER.front, color: PAPER.ink }}
      >
        {/* Paper grain + warm wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(rgba(0,0,0,0.045) 0.55px, transparent 0.55px), linear-gradient(165deg, rgba(255,255,255,0.55) 0%, transparent 38%, rgba(120,85,35,0.07) 100%)",
            backgroundSize: "2.75px 2.75px, 100% 100%",
          }}
        />
        {/* Soft center highlight — “press light” */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-28 rounded-b-[50%] bg-white/25 blur-2xl"
        />
        {/* Double margin rule */}
        <div
          aria-hidden
          className="absolute inset-y-5 inset-s-3 w-px"
          style={{ background: PAPER.rule }}
        />
        <div
          aria-hidden
          className="absolute inset-y-5 inset-s-[0.85rem] w-px opacity-50"
          style={{ background: PAPER.rule }}
        />
        {/* Dog-ear fold */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-e-px -top-px h-10 w-10"
          style={{
            background:
              "linear-gradient(225deg, rgba(255,255,255,0.55) 0%, rgba(230,210,170,0.9) 48%, transparent 50%)",
            clipPath: "polygon(100% 0, 0 0, 100% 100%)",
          }}
        />

        <div className="relative px-5 pb-5 pt-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function Masthead({
  dateLabel,
  title,
  desk,
}: {
  dateLabel: string;
  title: string;
  desk: string;
}) {
  return (
    <header className="text-center">
      <div className="px-1">
        <span className="font-display text-[9px] font-bold tabular-nums text-black/40">
          {dateLabel}
        </span>
      </div>

      <div className="mt-2.5 flex items-center gap-2.5">
        <span aria-hidden className="h-0.5 flex-1 bg-black" />
        <h1 className="shrink-0 px-0.5 font-display text-[1.05rem] font-black tracking-wide text-black">
          {title}
        </h1>
        <span aria-hidden className="h-0.5 flex-1 bg-black" />
      </div>
      <div aria-hidden className="mx-auto mt-1 h-px w-full bg-black/25" />

      <p className="mt-1.5 font-display text-[9px] font-bold uppercase tracking-[0.22em] text-black/35">
        {desk}
      </p>
    </header>
  );
}

function PaperCta({
  children,
  onClick,
  variant = "ink",
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "ink" | "accent" | "ghost";
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ y: 2, scale: 0.985 }}
      onClick={() => {
        playSound("click");
        haptic(HAPTIC.tap);
        onClick();
      }}
      className={cn(
        "mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl font-display text-base font-black transition-colors",
        variant === "accent" &&
          "bg-accent text-accent-foreground shadow-[0_4px_0_0_hsl(var(--accent-deep))]",
        variant === "ink" &&
          "bg-[#1c1914] text-[#f6efe0] shadow-[0_4px_0_0_rgba(0,0,0,0.4)]",
        variant === "ghost" &&
          "border-2 border-black/20 bg-black/4 text-black shadow-[0_3px_0_0_rgba(0,0,0,0.12)]",
      )}
    >
      {children}
    </motion.button>
  );
}

/** Reward seal — reads as a stamp, not a second CTA. */
function BoostSeal({
  multDisplay,
  resourceIcon,
  resourceLabel,
  effectLabel,
  rewardLabel,
  liveLabel,
  alreadyActive,
  isCoin,
}: {
  multDisplay: string;
  resourceIcon: string;
  resourceLabel: string;
  effectLabel: string;
  rewardLabel: string;
  liveLabel: string;
  alreadyActive: boolean;
  isCoin: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0.88, opacity: 0, y: 8 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.14 }}
      role="status"
      aria-label={`${multDisplay}× ${resourceLabel} ${effectLabel}`}
      className={cn(
        "relative mx-auto mt-5 w-full max-w-68 overflow-hidden rounded-[1.15rem] px-4 py-3.5 text-start",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_0_0_rgba(0,0,0,0.12)]",
        isCoin
          ? "bg-linear-to-br from-amber-200 via-amber-300 to-orange-300"
          : "bg-linear-to-br from-emerald-200 via-lime-300 to-emerald-300",
      )}
    >
      {/* Stamp perforation */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-1 rounded-[0.95rem] border border-dashed border-black/20"
      />

      <div className="relative flex items-center justify-between gap-2">
        <span className="font-display text-[10px] font-black uppercase tracking-[0.14em] text-black/55">
          {rewardLabel}
        </span>
        {alreadyActive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/15 px-2 py-0.5 font-display text-[10px] font-black uppercase tracking-wide text-black/75">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-emerald-700"
              animate={{ opacity: [1, 0.35, 1], scale: [1, 0.85, 1] }}
              transition={{ repeat: Infinity, duration: 1.1 }}
            />
            {liveLabel}
          </span>
        ) : null}
      </div>

      <div className="relative mt-2.5 flex items-center gap-3">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08),0_2px_0_rgba(0,0,0,0.1)]",
            isCoin ? "bg-amber-50/90" : "bg-white/70",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resourceIcon}
            alt=""
            draggable={false}
            className="h-8 w-8 object-contain drop-shadow-sm"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[2rem] font-black leading-none tabular-nums tracking-tight text-black">
              {multDisplay}×
            </span>
            <span className="truncate font-display text-sm font-extrabold text-black/70">
              {resourceLabel}
            </span>
          </div>
          <p className="mt-1 font-display text-xs font-bold text-black/60">
            {effectLabel}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function NewspaperModal({ news, state, onClaim }: NewspaperModalProps) {
  const { t, locale } = useTranslation();
  const dateLabel = editionDate(locale);
  const reduceMotion = useReducedMotion();
  const dismiss = () => {
    playSound("click");
    haptic(HAPTIC.tap);
    onClaim();
  };

  // Cooldown: today's claim is spent and nothing is running.
  if (state === "cooldown" || !news) {
    return (
      <PaperSheet
        ariaLabel={t("news.masthead")}
        dismissLabel={t("common.ok")}
        onDismiss={dismiss}
      >
        <Masthead
          dateLabel={dateLabel}
          title={t("news.masthead")}
          desk={t("news.sportsDesk")}
        />

        <div className="relative mx-auto mt-6 flex h-21 w-21 items-center justify-center">
          <motion.span
            aria-hidden
            initial={{ scale: 1.35, opacity: 0, rotate: -18 }}
            animate={{ scale: 1, opacity: 1, rotate: -12 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 16,
              delay: 0.18,
            }}
            className="absolute -inset-e-4 -top-1 z-10 rounded-md border-[2.5px] border-rose-700/85 px-2 py-0.5 font-display text-[10px] font-black uppercase tracking-wider text-rose-700/95 shadow-sm"
          >
            {t("news.soldOut")}
          </motion.span>
          <div className="flex h-21 w-21 items-center justify-center rounded-full bg-black/4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/hub-news.png"
              alt=""
              draggable={false}
              className="h-14 w-14 object-contain drop-shadow-sm grayscale-[0.2]"
            />
          </div>
        </div>

        <h2 className="mt-5 font-display text-2xl font-black leading-tight text-black">
          {t("news.thatsAll")}
        </h2>
        <p className="mx-auto mt-2 max-w-[16rem] font-body text-sm font-bold leading-snug text-black/60">
          {t("news.comeBack")}
        </p>

        <div className="mt-5 rounded-xl border border-dashed border-black/20 bg-black/3 px-3 py-2.5">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-black/40">
            {t("news.finalEdition")}
          </p>
          <p className="mt-0.5 font-body text-[11px] font-semibold text-black/50">
            {t("news.nextDrop")}
          </p>
        </div>

        <PaperCta variant="ghost" onClick={onClaim}>
          {t("common.ok")}
        </PaperCta>
      </PaperSheet>
    );
  }

  const alreadyActive = state === "active";
  const isCoin = news.type === "COIN_BOOST";
  const multLabel = formatMultiplier(news.multiplier);
  const multDisplay = toLocaleDigits(multLabel, locale);
  const hoursDisplay = toLocaleDigits(BOOSTER_DURATION_HOURS, locale);
  const headlineKey = `news.events.${news.headline}`;
  const translated = t(headlineKey);
  const headline = translated === headlineKey ? news.headline : translated;
  const resourceIcon = isCoin ? "/icons/coin.png" : "/icons/fans.png";
  const resourceLabel = isCoin ? t("result.coins") : t("stadium.fans");
  const effectLabel = t("news.effectForHours", { hours: hoursDisplay });

  return (
    <PaperSheet
      ariaLabel={t("news.masthead")}
      dismissLabel={t("common.ok")}
      onDismiss={dismiss}
    >
      <Masthead
        dateLabel={dateLabel}
        title={t("news.masthead")}
        desk={t("news.sportsDesk")}
      />

      {!alreadyActive ? (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 font-display text-[10px] font-black uppercase tracking-wide text-white shadow-[0_2px_0_0_rgba(127,29,29,0.85)]"
        >
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-white"
            animate={
              reduceMotion ? undefined : { opacity: [1, 0.3, 1] }
            }
            transition={{ repeat: Infinity, duration: 0.85 }}
          />
          {t("news.breaking")}
        </motion.p>
      ) : null}

      {/* Story art */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.06, type: "spring", stiffness: 260, damping: 18 }}
        className="relative mx-auto mt-5 flex h-19 w-19 items-center justify-center"
      >
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-full",
            isCoin ? "bg-amber-400/20" : "bg-emerald-400/20",
          )}
        />
        <div
          aria-hidden
          className="absolute inset-1 rounded-full bg-white/35 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]"
        />
        {news.emoji ? (
          <span
            className="relative text-[2.75rem] leading-none drop-shadow-sm"
            aria-hidden
          >
            {news.emoji}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/icons/hub-news.png"
            alt=""
            draggable={false}
            className="relative h-14 w-14 object-contain"
          />
        )}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-4 px-1 font-display text-[1.4rem] font-black leading-tight text-black"
      >
        {headline}
      </motion.h2>

      <BoostSeal
        multDisplay={multDisplay}
        resourceIcon={resourceIcon}
        resourceLabel={resourceLabel}
        effectLabel={effectLabel}
        rewardLabel={t("news.rewardLabel")}
        liveLabel={t("news.liveNow")}
        alreadyActive={alreadyActive}
        isCoin={isCoin}
      />

      <p className="mt-3.5 font-body text-xs font-bold leading-snug text-black/50">
        {alreadyActive ? t("news.stillRunning") : t("news.claimHint")}
      </p>

      <PaperCta
        variant={alreadyActive ? "ghost" : "accent"}
        onClick={onClaim}
      >
        {alreadyActive ? t("common.nice") : t("news.claim")}
      </PaperCta>
    </PaperSheet>
  );
}
