"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameCta } from "@/components/ui/game/GameCta";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";

type MissedPopupProps = {
  onContinue: () => void;
};

/**
 * Dramatic "Missed!" overlay after a wrong/timed-out kick.
 * Reserves UI space for future booster cards via a disabled "Use Superpower"
 * action (see PRD §5 — Collectible Super-Power Cards).
 */
export function MissedPopup({ onContinue }: MissedPopupProps) {
  const { t } = useTranslation();
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-hidden
      />

      <motion.div
        role="alertdialog"
        aria-label={t("quiz.missed")}
        initial={{ scale: 0.7, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative w-full max-w-xs"
      >
        <GamePanel tone="rose" className="px-5 pb-5 pt-6 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -end-10 top-0 h-28 w-28 rounded-full bg-rose-400/25 blur-3xl"
          />

          <motion.div
            animate={{ rotate: [0, -10, 10, -6, 0] }}
            transition={{ duration: 0.5 }}
            className="relative mx-auto"
            aria-hidden
          >
            <GameIconWell
              size="lg"
              src="/icons/broken-heart.png"
              className="mx-auto h-16 w-16"
              iconClassName="h-10 w-10"
            />
          </motion.div>

          <h2 className="relative mt-3 font-display text-2xl font-black text-rose-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
            {t("quiz.missed")}
          </h2>

          <button
            type="button"
            disabled
            aria-disabled
            className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-bubble-xl bg-black/40 px-4 py-3 font-display text-sm font-black text-white/45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
          >
            <GameIconWell
              size="sm"
              src="/icons/energy.png"
              className="h-7 w-7 opacity-60"
              iconClassName="h-4 w-4"
            />
            <span>{t("quiz.useSuperpower")}</span>
            <GameChip className="text-[10px]">{t("common.soon")}</GameChip>
          </button>

          <GameCta
            variant="accent"
            block
            className="relative mt-3"
            onClick={onContinue}
          >
            {t("common.continue")}
          </GameCta>
        </GamePanel>
      </motion.div>
    </motion.div>
  );
}
