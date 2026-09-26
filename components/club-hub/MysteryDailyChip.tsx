"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { playSound } from "@/lib/audio/SoundManager";

type Props = {
  /** @deprecated Solo GotD retired — ignored. */
  mysteryStreak?: number;
};

/** Hub shortcut to online Duel — live formats play as specials there. */
export function MysteryDailyChip({}: Props) {
  const { t } = useTranslation();

  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Link href="/play/duel" onClick={() => playSound("click")}>
        <GamePanel
          tone="emerald"
          className="flex w-full items-center gap-3 px-3 py-3"
        >
          <GameIconWell
            size="lg"
            src="/icons/trophy.png"
            iconClassName="h-10 w-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
          />

          <div className="relative min-w-0 flex-1 text-start">
            <p className="font-display text-sm font-black text-white drop-shadow-sm">
              {t("play.duel")}
            </p>
            <p className="mt-0.5 truncate font-display text-[11px] font-bold text-white/70">
              {t("club.duelChipIdle")}
            </p>
          </div>

          <span className="relative inline-flex min-h-9 shrink-0 items-center gap-1 rounded-bubble bg-accent px-2.5 py-1.5 font-display text-[11px] font-black text-accent-foreground shadow-[0_3px_0_0_rgba(0,0,0,0.35)]">
            <span aria-hidden>▶</span>
            {t("play.ctaDuel")}
          </span>
        </GamePanel>
      </Link>
    </motion.div>
  );
}
