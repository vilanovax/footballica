"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GameChip } from "@/components/ui/game/GameChip";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { fansSoftCap } from "@/lib/club/upgradeEffects";
import { stadiumScene } from "@/lib/club/stadiumScene";
import { staminaRegenIntervalMinutes } from "@/lib/club/stamina";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { playSound } from "@/lib/audio/SoundManager";

const Confetti = dynamic(() =>
  import("./Confetti").then((m) => m.Confetti),
);

type StadiumHeroProps = {
  stadiumLevel: number;
  fans: number;
  trainingGroundLevel: number;
  medicalLevel: number;
  celebrateKey: number;
  celebrating: boolean;
  /** Closest coin upgrade is affordable — chip on the stadium, not a shop on the page. */
  upgradeReady: boolean;
  onOpenManage: () => void;
};

/** Crowd seats lit by fan fill (0…18 dots). */
function crowdCountFor(fans: number, cap: number): number {
  const fill = Math.min(1, Math.max(0, fans / Math.max(1, cap)));
  return Math.max(2, Math.min(18, Math.round(2 + fill * 16)));
}

export function StadiumHero({
  stadiumLevel,
  fans,
  trainingGroundLevel,
  medicalLevel,
  celebrateKey,
  celebrating,
  upgradeReady,
  onOpenManage,
}: StadiumHeroProps) {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const scene = stadiumScene(stadiumLevel);
  const tierIndex = scene.index;
  const cap = fansSoftCap(stadiumLevel);
  const crowdN = crowdCountFor(fans, cap);
  const fillPct = Math.min(100, Math.round((fans / Math.max(1, cap)) * 100));
  const regenMinutes = staminaRegenIntervalMinutes(medicalLevel);
  const floodlit = stadiumLevel >= 3;

  function openManage() {
    haptic(HAPTIC.tap);
    playSound("click");
    onOpenManage();
  }

  return (
    <>
      <button
        type="button"
        onClick={openManage}
        aria-label={t("stadium.openDetails")}
        className="w-full text-start transition-transform active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
      >
        <GamePanel
          tone={scene.tone}
          className="aspect-2/1 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
        >
        <div
          aria-hidden
          className={[
            "pointer-events-none absolute -end-10 top-0 h-36 w-36 rounded-full blur-3xl",
            scene.glow,
          ].join(" ")}
        />

        {/* Floodlight beams — level 3+ (the stadium's one ambient moment) */}
        {floodlit && (
          <>
            <motion.div
              aria-hidden
              className="pointer-events-none absolute start-[12%] top-0 h-[55%] w-10 origin-top bg-linear-to-b from-sky-200/35 to-transparent"
              style={{ transform: "skewX(-12deg)" }}
              animate={reduceMotion ? undefined : { opacity: [0.35, 0.7, 0.35] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute end-[12%] top-0 h-[55%] w-10 origin-top bg-linear-to-b from-sky-200/35 to-transparent"
              style={{ transform: "skewX(12deg)" }}
              animate={reduceMotion ? undefined : { opacity: [0.35, 0.7, 0.35] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: 0.35 }}
            />
            <span
              className="absolute start-3 top-2 h-2.5 w-8 rounded-sm bg-sky-100/90 shadow-[0_3px_8px_rgba(186,230,253,0.7)]"
              aria-hidden
            />
            <span
              className="absolute end-3 top-2 h-2.5 w-8 rounded-sm bg-sky-100/90 shadow-[0_3px_8px_rgba(186,230,253,0.7)]"
              aria-hidden
            />
          </>
        )}

        {/* Stadium art — tier filter treatment */}
        <div className="absolute inset-x-0 top-[6%] flex justify-center">
          <motion.div
            className="relative"
            animate={celebrating && !reduceMotion ? { y: [0, -6, 0] } : undefined}
            transition={{ duration: 0.7 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/stadium.png"
              alt=""
              draggable={false}
              className={[
                "h-20 w-auto max-w-[58%] object-contain sm:h-24",
                scene.art,
              ].join(" ")}
            />
          </motion.div>
        </div>

        {/* Crowd seats — CSS dots in stands, density from fans */}
        <div
          className="absolute inset-x-[22%] top-[34%] z-[1] flex flex-wrap justify-center gap-1 px-1"
          aria-hidden
        >
          {Array.from({ length: crowdN }).map((_, i) => (
            <span
              key={`${crowdN}-${i}`}
              className={[
                "inline-block h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2",
                floodlit
                  ? "bg-sky-200/90"
                  : stadiumLevel >= 2
                    ? "bg-emerald-200/85"
                    : stadiumLevel >= 1
                      ? "bg-amber-200/80"
                      : "bg-stone-300/70",
              ].join(" ")}
              style={{ opacity: 0.45 + (i / crowdN) * 0.5 }}
            />
          ))}
        </div>

        {/* Pitch strip */}
        <div className={["absolute inset-x-0 bottom-0 h-[42%]", scene.pitch].join(" ")} aria-hidden>
          <div className="absolute inset-0 flex flex-col justify-evenly opacity-40">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={
                  i % 2 === 0 ? "h-full bg-white/10" : "h-full bg-transparent"
                }
              />
            ))}
          </div>
          <div className="absolute left-1/2 top-[42%] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/35" />
          <div className="absolute left-1/2 top-[42%] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
        </div>

        <FacilityBadge
          iconSrc="/icons/training.png"
          label={t("stadium.badgeTraining", {
            n: toLocaleDigits(trainingGroundLevel, locale),
          })}
          side="start"
          level={trainingGroundLevel}
          pulse={celebrating}
        />
        <FacilityBadge
          iconSrc="/icons/medical.png"
          label={t("stadium.badgeMedical", {
            n: toLocaleDigits(regenMinutes, locale),
          })}
          side="end"
          level={medicalLevel}
          pulse={celebrating}
        />

        {/* Bottom HUD — fans are the stadium's one number */}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/90 via-black/70 to-transparent px-3 pb-2 pt-6">
          <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-black/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">
            <motion.div
              className={[
                "h-full rounded-full",
                fillPct >= 90
                  ? "bg-linear-to-r from-amber-400 to-orange-400"
                  : "bg-linear-to-r from-emerald-400 to-lime-300",
              ].join(" ")}
              initial={false}
              animate={{ width: `${fillPct}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 22 }}
            />
          </div>
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="font-display text-sm font-black text-white">
                {toLocaleDigits(fans, locale)}
                <span className="text-white/55">
                  /{toLocaleDigits(cap, locale)}
                </span>{" "}
                {t("stadium.fans")}
              </p>
              <p className="mt-0.5 font-display text-[11px] font-bold text-white/75">
                {t("stadium.lvl")} {toLocaleDigits(stadiumLevel, locale)} ·{" "}
                {t(`stadium.tiers.${tierIndex}`)}
              </p>
            </div>
            <GameChip tone={fillPct >= 90 ? "amber" : "emerald"}>
              {toLocaleDigits(fillPct, locale)}%
            </GameChip>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p className="font-display text-[11px] font-black text-lime-200">
              {t("stadium.tapDetails")}
            </p>
            {upgradeReady ? (
              <p className="font-display text-[11px] font-bold text-white/70">
                {t("club.upgradeReadyStatus")}
              </p>
            ) : null}
          </div>
        </div>

        {celebrating ? (
          <div
            key={celebrateKey}
            className="stadium-sweep pointer-events-none absolute inset-0 z-20"
          />
        ) : null}
        <AnimatePresence>
          {celebrating ? <Confetti key={celebrateKey} /> : null}
        </AnimatePresence>
        </GamePanel>
      </button>
    </>
  );
}

function FacilityBadge({
  iconSrc,
  label,
  side,
  level,
  pulse,
}: {
  iconSrc: string;
  label: string;
  side: "start" | "end";
  level: number;
  pulse: boolean;
}) {
  const grown = level > 0;
  return (
    <motion.div
      className={[
        "absolute bottom-[52%] z-10",
        side === "start" ? "start-2" : "end-2",
        grown ? "" : "opacity-70",
      ].join(" ")}
      animate={pulse ? { scale: [1, 1.08, 1] } : undefined}
      transition={pulse ? { duration: 0.5 } : undefined}
      aria-hidden
    >
      <GameChip tone={grown ? "emerald" : "default"} className="px-1.5 py-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          alt=""
          draggable={false}
          className={[
            "object-contain",
            grown ? "h-4 w-4" : "h-3.5 w-3.5 opacity-70",
          ].join(" ")}
        />
        <span className="font-display text-[9px] font-extrabold leading-none">
          {label}
        </span>
      </GameChip>
    </motion.div>
  );
}
