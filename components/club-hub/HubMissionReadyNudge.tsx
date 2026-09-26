"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  hasMissionRewardReady,
  countMissionRewardsReady,
} from "@/lib/game/missionRewards";
import type { EvaluateMissionsResult } from "@/lib/game/missionTypes";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { GameChip } from "@/components/ui/game/GameChip";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { playSound } from "@/lib/audio/SoundManager";

type HubMissionReadyNudgeProps = {
  dailyBoard: EvaluateMissionsResult | null;
  campaignBoard: EvaluateMissionsResult | null;
  onOpen: () => void;
};

/**
 * One-line hub nudge — only when Daily/Campaign have claimable rewards.
 * Full mission list lives in MissionDrawer (header icon).
 */
export function HubMissionReadyNudge({
  dailyBoard,
  campaignBoard,
  onOpen,
}: HubMissionReadyNudgeProps) {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const ready = hasMissionRewardReady(dailyBoard, campaignBoard);
  if (!ready) return null;

  const count = countMissionRewardsReady(dailyBoard, campaignBoard);

  function open() {
    playSound("click");
    haptic(HAPTIC.tap);
    onOpen();
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
    >
      <button
        type="button"
        onClick={open}
        aria-label={t("missions.drawerSubtitleReady")}
        className="block w-full text-start transition-transform active:scale-[0.98]"
      >
        <GamePanel
          tone="amber"
          className="flex min-h-12 items-center gap-2.5 px-3 py-2.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/gift.png"
            alt=""
            aria-hidden
            draggable={false}
            className="h-8 w-8 shrink-0 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
          />
          <span className="min-w-0 flex-1 font-display text-sm font-black text-amber-50">
            {t("missions.drawerSubtitleReady")}
          </span>
          <GameChip tone="amber" className="shrink-0 tabular-nums">
            {toLocaleDigits(count, locale)}
          </GameChip>
        </GamePanel>
      </button>
    </motion.div>
  );
}
