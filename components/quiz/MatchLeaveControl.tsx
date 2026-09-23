"use client";

import { useState } from "react";
import { playSound } from "@/lib/audio/SoundManager";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { cn } from "@/lib/utils";
import { LeaveMatchDialog, type LeaveCopyTone } from "./LeaveMatchDialog";

export type { LeaveCopyTone };

type MatchLeaveControlProps = {
  /** Freeze the fuse while the confirm sheet is open (in-match only). */
  setPaused?: (paused: boolean) => void;
  /** Abandon the match / leave the surface (reset store + navigate). */
  onConfirmLeave: () => void;
  /**
   * `match` — progress will be lost (default).
   * `lobby` — softer confirm for hub/lobby exits.
   */
  tone?: LeaveCopyTone;
  className?: string;
};

/**
 * Shared immersive exit — same rose close well + confirm dialog
 * for Penalty, Survival, Tiki-Taka, Grid, Mystery, and lobbies.
 */
export function MatchLeaveControl({
  setPaused,
  onConfirmLeave,
  tone = "match",
  className,
}: MatchLeaveControlProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  function requestLeave() {
    playSound("click");
    haptic(HAPTIC.tap);
    setPaused?.(true);
    setOpen(true);
  }

  function stay() {
    playSound("click");
    setPaused?.(false);
    setOpen(false);
  }

  function leave() {
    playSound("click");
    setOpen(false);
    onConfirmLeave();
  }

  return (
    <>
      <button
        type="button"
        onClick={requestLeave}
        aria-label={t("common.close")}
        className={cn(
          "shrink-0 transition-transform active:scale-90",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring",
          className,
        )}
      >
        <GameIconWell
          size="md"
          src="/icons/close-arena.png"
          className="h-11 w-11 shadow-[0_0_0_1px_hsl(var(--arena-ring-rose)/0.55),0_3px_0_0_rgba(0,0,0,0.4)]"
          iconClassName="h-7 w-7 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
        />
      </button>

      <LeaveMatchDialog
        open={open}
        tone={tone}
        onStay={stay}
        onLeave={leave}
      />
    </>
  );
}
