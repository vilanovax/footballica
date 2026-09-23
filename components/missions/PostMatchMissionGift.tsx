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
 * Compact post-match mission pulse — animated gift opens MissionDrawer.
 * Replaces the bulky MissionProgressBanner on Arena result screens.
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
        initial={reduceMotion ? false : { opacity: 0, scale: 0.85, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.2 }}
        className={["flex justify-center", className ?? ""].join(" ")}
      >
        <motion.button
          type="button"
          onClick={handleOpen}
          aria-label={t("result.missionGiftAria")}
          className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-black/35 ring-1 ring-amber-300/35 shadow-[0_0_28px_rgba(251,191,36,0.32)] transition-transform active:scale-95"
          animate={
            reduceMotion
              ? undefined
              : rewardReady
                ? {
                    rotate: [0, -8, 8, -6, 6, 0],
                    y: [0, -3, 0],
                    scale: [1, 1.06, 1],
                  }
                : {
                    y: [0, -2, 0],
                  }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: rewardReady ? 1.35 : 2.2,
                  repeat: Infinity,
                  repeatDelay: rewardReady ? 0.85 : 1.4,
                  ease: "easeInOut",
                }
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/gift.png"
            alt=""
            aria-hidden
            draggable={false}
            className="h-18 w-18 object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]"
          />
          {rewardReady && (
            <span
              aria-hidden
              className="absolute -inset-e-1 -top-1 h-3.5 w-3.5 rounded-full bg-rose-400 ring-2 ring-arena shadow-[0_0_10px_rgba(251,113,133,0.75)]"
            />
          )}
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
