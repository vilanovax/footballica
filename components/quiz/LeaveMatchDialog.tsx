"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { GameCta } from "@/components/ui/game/GameCta";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";
import type { LeaveCopyTone } from "./MatchLeaveControl";

type LeaveMatchDialogProps = {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
  tone?: LeaveCopyTone;
};

/** Confirm before abandoning an immersive quiz surface. */
export function LeaveMatchDialog({
  open,
  onStay,
  onLeave,
  tone = "match",
}: LeaveMatchDialogProps) {
  const { t } = useTranslation();
  const isLobby = tone === "lobby";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="leave-match-dialog"
          className="fixed inset-0 z-70 flex items-center justify-center px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          <button
            type="button"
            aria-label={t("quiz.leaveStay")}
            onClick={onStay}
            className="absolute inset-0 bg-black/75 backdrop-blur-[6px]"
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="leave-match-title"
            aria-describedby="leave-match-desc"
            className="relative w-full max-w-[22rem]"
            initial={{ scale: 0.92, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
          >
            <GamePanel tone="amber" className="p-6 pt-7 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute -end-8 top-0 h-28 w-28 rounded-full bg-amber-300/25 blur-3xl"
              />

              <GameIconWell
                size="xl"
                amber
                src="/icons/broken-heart.png"
                className="relative mx-auto"
              />

              <h2
                id="leave-match-title"
                className="relative mt-4 font-display text-xl font-black text-white"
              >
                {isLobby ? t("quiz.leaveLobbyTitle") : t("quiz.leaveTitle")}
              </h2>
              <p
                id="leave-match-desc"
                className="relative mt-2.5 font-display text-sm font-bold leading-relaxed text-white/70"
              >
                {isLobby ? t("quiz.leaveLobbyBody") : t("quiz.leaveBody")}
              </p>

              <div className="relative mt-7 flex flex-col gap-2.5">
                <GameCta variant="primary" block onClick={onStay}>
                  {t("quiz.leaveStay")}
                </GameCta>
                <GameCta
                  variant="ghost"
                  block
                  onClick={onLeave}
                  className="bg-rose-500/15 text-rose-100 shadow-[inset_0_0_0_1px_hsl(var(--arena-ring-rose)/0.45)]"
                >
                  {isLobby
                    ? t("quiz.leaveLobbyConfirm")
                    : t("quiz.leaveConfirm")}
                </GameCta>
              </div>
            </GamePanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
