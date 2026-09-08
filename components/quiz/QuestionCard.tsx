"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CareerPathPayload, HigherLowerPayload } from "@/lib/quiz/formats";
import type { QuizQuestionType } from "@/lib/quiz/types";
import { GameChip } from "@/components/ui/game/GameChip";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { FormatPrompt } from "./FormatPrompt";

type QuestionCardProps = {
  /** Localized question text for the active language. */
  text: string;
  /** Localized category label. */
  category: string;
  /** Opens the report flow (modal is owned by the match, above the options). */
  onReport: () => void;
  type?: QuizQuestionType;
  mediaUrl?: string | null;
  careerPath?: CareerPathPayload;
  higherLower?: HigherLowerPayload;
  /** Snap progressive image reveal when the kick is locked. */
  imageCleared?: boolean;
  /** Stable id for REVEAL_IMAGE remount / restart. */
  questionId?: string;
};

export function QuestionCard({
  text,
  category,
  onReport,
  type,
  mediaUrl,
  careerPath,
  higherLower,
  imageCleared,
  questionId,
}: QuestionCardProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -24, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <GamePanel tone="emerald" className="p-4">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-8 -top-10 h-28 w-28 rounded-full bg-emerald-400/20 blur-3xl"
        />
        <div className="relative flex items-start justify-between gap-3">
          <GameChip tone="emerald">{category}</GameChip>
          <button
            type="button"
            aria-label={t("report.flag")}
            title={t("report.flag")}
            onClick={onReport}
            className="game-icon-btn -me-1 -mt-1 shrink-0 rounded-full bg-black/35 text-white/60 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] transition-colors active:text-rose-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/target.png"
              alt=""
              draggable={false}
              className="h-4 w-4 object-contain opacity-80"
            />
          </button>
        </div>
        <p className="relative mt-3 font-display text-xl font-black leading-snug text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
          {text}
        </p>
        <div className="relative">
          <FormatPrompt
            type={type}
            mediaUrl={mediaUrl}
            careerPath={careerPath}
            higherLower={higherLower}
            cleared={imageCleared}
            resetKey={questionId}
          />
        </div>
      </GamePanel>
    </motion.div>
  );
}
