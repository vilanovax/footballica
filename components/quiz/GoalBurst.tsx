"use client";

import { motion } from "framer-motion";
import { ResourceIcon } from "@/components/common/ResourceIcon";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";

type GoalBurstProps = {
  /** Fans this goal is worth. Omitted when the mode does not pay per goal. */
  fans?: number;
};

/**
 * Floating "Goal!" celebration. A per-goal fan line sits under the word
 * when this kick actually pays fans.
 */
export function GoalBurst({ fans = 0 }: GoalBurstProps) {
  const { t, locale } = useTranslation();
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.3, y: 30, rotate: -8 }}
        animate={{ scale: [0.3, 1.25, 1], y: [30, -10, -40], rotate: [-8, 4, 0] }}
        exit={{ opacity: 0, y: -70, scale: 0.9 }}
        transition={{ duration: 1.2, times: [0, 0.45, 1], ease: "easeOut" }}
        className="flex flex-col items-center gap-1"
      >
        <span className="text-5xl drop-shadow" aria-hidden>
          ⚽️
        </span>
        <span className="font-display text-4xl font-bold text-primary drop-shadow">
          {t("quiz.goal")}
        </span>
        {fans > 0 && (
          <span className="mt-1 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-black/55 px-3 font-display text-base font-black text-amber-100 shadow-[0_0_0_1px_rgba(255,255,255,0.16),0_3px_0_0_rgba(0,0,0,0.35)]">
            <ResourceIcon kind="fans" size="sm" />
            <span dir="ltr" className="tabular-nums">
              {t("result.earnedPrefix")}
              {toLocaleDigits(fans, locale)}
            </span>
            <span>{t("result.fans")}</span>
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}
