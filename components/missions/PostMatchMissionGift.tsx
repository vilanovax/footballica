"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { EvaluateMissionsResult } from "@/lib/game/missionTypes";
import { hasMissionRewardReady } from "@/lib/game/missionRewards";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { playSound } from "@/lib/audio/SoundManager";

const MissionDrawer = dynamic(() =>
  import("@/components/profile/MissionDrawer").then((m) => m.MissionDrawer),
);

type PostMatchMissionGiftProps = {
  missions: EvaluateMissionsResult;
  className?: string;
};

/**
 * Compact post-match mission pulse — opens MissionDrawer.
 * Horizontal chip so the result CTA dock stays thumb-reachable.
 */
export function PostMatchMissionGift({
  missions,
  className,
}: PostMatchMissionGiftProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const rewardReady = hasMissionRewardReady(missions);

  function handleOpen() {
    playSound("click");
    haptic(HAPTIC.tap);
    setOpen(true);
  }

  return (
    <>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 20, delay: 0.15 }}
        className={["flex justify-center", className ?? ""].join(" ")}
      >
        <motion.button
          type="button"
          onClick={handleOpen}
          aria-label={t("result.missionGiftAria")}
          className={[
            "relative inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-2.5 rounded-2xl px-4 py-2.5",
            "bg-black/40 ring-1 ring-amber-300/40",
            "shadow-[0_3px_0_0_rgba(0,0,0,0.35),0_0_20px_rgba(251,191,36,0.22)]",
            "transition-transform active:scale-[0.98]",
          ].join(" ")}
          animate={
            reduceMotion
              ? undefined
              : rewardReady
                ? { scale: [1, 1.02, 1] }
                : undefined
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: 1.4,
                  repeat: Infinity,
                  repeatDelay: 1.1,
                  ease: "easeInOut",
                }
          }
        >
          <span className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/gift.png"
              alt=""
              aria-hidden
              draggable={false}
              className="h-10 w-10 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
            />
            {rewardReady && (
              <span
                aria-hidden
                className="absolute -inset-e-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-400 ring-2 ring-arena shadow-[0_0_8px_rgba(251,113,133,0.7)]"
              />
            )}
          </span>
          <span className="min-w-0 text-start">
            <span className="block font-display text-sm font-black text-amber-100">
              {rewardReady
                ? t("result.missionGiftReady")
                : t("result.missionGiftLabel")}
            </span>
            <span className="block font-display text-[11px] font-bold text-white/55">
              {t("result.missionGiftHint")}
            </span>
          </span>
        </motion.button>
      </motion.div>

      <MissionDrawer
        open={open}
        onOpenChange={setOpen}
        preferredTab="daily"
        dailyBoard={missions}
      />
    </>
  );
}

/** Whether the post-match gift should appear for this board. */
export function shouldShowPostMatchMissionGift(
  missions?: EvaluateMissionsResult | null,
): boolean {
  if (!missions?.batchId) return false;
  if (hasMissionRewardReady(missions)) return true;
  if (missions.chestReady) return true;
  if (missions.updates.length > 0) return true;
  return false;
}
