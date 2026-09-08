"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { submitQuestionReport } from "@/actions/submitReport";
import { REPORT_REASONS, type ReportReasonCode } from "@/lib/reports/reasons";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { GameCta } from "@/components/ui/game/GameCta";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";

type ReportModalProps = {
  questionId: string;
  onClose: () => void;
};

export function ReportModal({ questionId, onClose }: ReportModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<ReportReasonCode | null>(null);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  function handleSubmit() {
    if (!reason) return;
    start(async () => {
      const res = await submitQuestionReport(questionId, reason, note);
      if (res.ok) {
        haptic(HAPTIC.goal);
        toast.success(t("report.success"));
        onClose();
      } else {
        toast.error(t("report.error"));
      }
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-70 flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label={t("report.cancel")}
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-[6px]"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ y: "100%", opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10 w-full max-w-mobile px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-4"
      >
        <GamePanel tone="rose" className="rounded-t-bubble-lg p-5 sm:rounded-bubble-lg">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <GameIconWell size="md" src="/icons/broken-heart.png" />
              <div>
                <h2 className="font-display text-lg font-black leading-tight text-white">
                  {t("report.title")}
                </h2>
                <p className="font-display text-xs font-bold text-white/65">
                  {t("report.subtitle")}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label={t("report.cancel")}
              onClick={onClose}
              className="game-icon-btn flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-full bg-white/10 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/close.png"
                alt=""
                aria-hidden
                className="h-4 w-4 object-contain"
              />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {REPORT_REASONS.map((r) => {
              const selected = reason === r.code;
              return (
                <motion.button
                  key={r.code}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setReason(r.code)}
                  aria-pressed={selected}
                  className={[
                    "min-h-touch rounded-full px-4 py-2 font-display text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
                    selected
                      ? "bg-white text-rose-950 shadow-[0_3px_0_0_rgba(0,0,0,0.35)]"
                      : "bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.14)]",
                  ].join(" ")}
                >
                  {t(`report.reasons.${r.code}`)}
                </motion.button>
              );
            })}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("report.notePlaceholder")}
            rows={2}
            maxLength={500}
            className="game-input mt-4 w-full resize-none p-3 text-sm"
          />

          <div className="mt-4 flex items-center gap-2.5">
            <GameCta
              variant="accent"
              block
              disabled={!reason || pending}
              onClick={handleSubmit}
              className="flex-1"
            >
              {pending ? "…" : t("report.submit")}
            </GameCta>
            <GameCta
              variant="ghost"
              disabled={pending}
              onClick={onClose}
              className="shrink-0 px-4"
            >
              {t("report.cancel")}
            </GameCta>
          </div>
        </GamePanel>
      </motion.div>
    </motion.div>
  );
}
