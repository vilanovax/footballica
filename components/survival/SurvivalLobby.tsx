"use client";

import Link from "next/link";
import {
  PremiumChallenges,
  type PlayChallengeCard,
} from "@/components/play/PremiumChallenges";
import { TrophyShowcase } from "@/components/survival/TrophyShowcase";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { playSound } from "@/lib/audio/SoundManager";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";

type SurvivalLobbyProps = {
  challenges: PlayChallengeCard[];
  coins: number;
  survivalBest: number;
};

/**
 * Survival hub — one pitch bed: identity + classic run, then trophies.
 */
export function SurvivalLobby({
  challenges,
  coins,
  survivalBest,
}: SurvivalLobbyProps) {
  const { t, locale } = useTranslation();
  const liveCount = challenges.length;

  return (
    <section className="flex flex-1 flex-col gap-2 pb-4">
      <GamePanel tone="rose" className="relative p-3.5 text-start">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-10 -top-8 h-28 w-28 rounded-full bg-rose-400/25 blur-3xl"
        />
        <div className="relative flex items-start gap-3">
          <Link
            href="/play"
            aria-label={t("survival.backPlay")}
            onClick={() => {
              playSound("click");
              haptic(HAPTIC.tap);
            }}
            className="order-last shrink-0 transition-transform active:scale-90"
          >
            <GameIconWell size="md" src="/icons/close.png" />
          </Link>
          <GameIconWell
            size="md"
            src="/icons/heart.png"
            className="h-12 w-12"
            iconClassName="h-7 w-7"
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xs font-bold text-rose-200/85">
              {t("survival.eyebrow")}
            </p>
            <h1 className="mt-0.5 font-display text-2xl font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
              {t("survival.lobbyTitle")}
            </h1>
            <p
              className="mt-1 font-display text-xs font-bold leading-snug text-white/65"
              dir="auto"
            >
              {t("survival.lobbySub")}
            </p>
          </div>
        </div>

        <div className="relative mt-3 border-t border-white/10 pt-3">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-sm font-extrabold text-white">
                {t("survival.classicTitle")}
              </h2>
              <p className="mt-0.5 font-display text-[11px] font-bold text-white/60">
                {t("survival.classicSub")}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-1">
              <GameChip tone="amber" className="gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/energy.png"
                  alt=""
                  draggable={false}
                  className="h-3.5 w-3.5 object-contain"
                />
                {toLocaleDigits(1, locale)}
              </GameChip>
              <GameChip tone="amber" className="gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/trophy.png"
                  alt=""
                  draggable={false}
                  className="h-3.5 w-3.5 object-contain"
                />
                {toLocaleDigits(survivalBest, locale)}
              </GameChip>
            </div>
          </div>
          <Link
            href="/play/survival?pick=1"
            onClick={() => {
              playSound("click");
              haptic(HAPTIC.tap);
            }}
            className="game-cta game-cta-accent relative mt-3 flex w-full min-h-12 items-center justify-center text-sm"
          >
            {t("survival.classicCta")}
          </Link>
        </div>
      </GamePanel>

      {liveCount > 0 ? (
        <div className="hub-deck flex flex-1 flex-col gap-3">
          <TrophyShowcase challenges={challenges} />
          <PremiumChallenges
            challenges={challenges}
            coins={coins}
            variant="lobby"
          />
        </div>
      ) : (
        <p className="px-1 font-display text-xs font-bold text-arena-muted">
          {t("survival.noChallenges")}
        </p>
      )}
    </section>
  );
}
