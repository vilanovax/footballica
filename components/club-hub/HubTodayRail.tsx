"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import type { CampaignSeasonView } from "@/lib/game/campaignSeason";
import { campaignSeasonActive } from "@/lib/game/campaignSeason";
import type { ActiveNewsBoosterSnapshot } from "@/lib/club/upgrades";
import { ActiveNewsChip } from "@/components/club-hub/ActiveNewsChip";
import { CampaignSeasonCard } from "@/components/club-hub/CampaignSeasonCard";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GameTile } from "@/components/ui/game/GameTile";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { playSound } from "@/lib/audio/SoundManager";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { cn } from "@/lib/utils";

type HubTodayRailProps = {
  /** @deprecated Solo GotD retired — kept for ClubHub call-site compat. */
  mysteryStreak?: number;
  campaignSeason: CampaignSeasonView | null;
  activeNews: ActiveNewsBoosterSnapshot | null;
  onOpenCampaign: () => void;
  onOpenNews: () => void;
  onNewsExpired: () => void;
};

/**
 * Secondary hub activities — tucked under the stadium so the first viewport
 * stays HUD + stadium world (progressive disclosure).
 */
export function HubTodayRail({
  campaignSeason,
  activeNews,
  onOpenCampaign,
  onOpenNews,
  onNewsExpired,
}: HubTodayRailProps) {
  const { t, locale } = useTranslation();
  const seasonOn = campaignSeason
    ? campaignSeasonActive(campaignSeason)
    : false;
  const rewardReady = Boolean(
    campaignSeason &&
      (campaignSeason.chestReady || campaignSeason.claimableCount > 0),
  );
  const hasCampaignBody = Boolean(
    campaignSeason &&
      (campaignSeason.chapters.length > 0 || rewardReady),
  );
  // Auto-open when there's something to show under the chip (chapters / claim).
  const [campaignOpen, setCampaignOpen] = useState(false);
  const missionPct =
    campaignSeason && campaignSeason.missionsTotal > 0
      ? Math.round(
          (campaignSeason.missionsDone / campaignSeason.missionsTotal) * 100,
        )
      : 0;

  return (
    <section className="flex flex-col gap-1.5">
      <p className="px-0.5 font-display text-xs font-black text-arena-muted">
        {t("club.today")}
      </p>

      <div className="grid grid-cols-2 gap-1.5">
        <motion.div whileTap={{ scale: 0.98 }}>
          <Link
            href="/play/duel"
            onClick={() => playSound("click")}
            className="block rounded-bubble-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
          >
            <GameTile
              tone="emerald"
              className="flex min-h-touch w-full items-center gap-2 px-2 py-2"
            >
              <GameIconWell
                size="sm"
                src="/icons/trophy.png"
                className="h-9 w-9"
              />
              <span className="relative min-w-0 flex-1 text-start">
                <span className="block font-display text-xs font-black leading-tight text-white">
                  {t("play.duel")}
                </span>
                <span className="mt-0.5 block font-display text-[10px] font-bold leading-tight text-white/70">
                  {t("club.duelChipIdle")}
                </span>
              </span>
            </GameTile>
          </Link>
        </motion.div>

        {seasonOn && campaignSeason ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            aria-expanded={hasCampaignBody ? campaignOpen : undefined}
            onClick={() => {
              playSound("click");
              haptic(HAPTIC.light);
              if (!hasCampaignBody) {
                onOpenCampaign();
                return;
              }
              setCampaignOpen((v) => !v);
            }}
            className="w-full rounded-bubble-xl text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
          >
            <GameTile
              tone={rewardReady ? "amber" : "emerald"}
              className="flex min-h-touch w-full items-center gap-2 px-2 py-2"
            >
              <GameIconWell
                size="sm"
                amber={rewardReady}
                src="/icons/trophy.png"
                className="h-9 w-9"
              />
              <span className="relative min-w-0 flex-1">
                <span className="block font-display text-xs font-black leading-tight text-white">
                  {t("campaign.title")}
                </span>
                <span className="mt-1 flex items-center gap-1.5">
                  <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-black/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">
                    <span
                      className="block h-full rounded-full bg-linear-to-r from-emerald-400 to-lime-300"
                      style={{ width: `${missionPct}%` }}
                    />
                  </span>
                  <span className="shrink-0 font-display text-[10px] font-black tabular-nums text-white/80">
                    {toLocaleDigits(campaignSeason.missionsDone, locale)}/
                    {toLocaleDigits(campaignSeason.missionsTotal, locale)}
                  </span>
                </span>
              </span>
              {hasCampaignBody ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/icons/back.png"
                  alt=""
                  draggable={false}
                  className={cn(
                    "relative h-3.5 w-3.5 shrink-0 opacity-70 transition-transform ltr:rotate-180",
                    campaignOpen && "-rotate-90 ltr:rotate-90",
                  )}
                />
              ) : null}
            </GameTile>
          </motion.button>
        ) : (
          <button
            type="button"
            onClick={() => {
              playSound("click");
              haptic(HAPTIC.light);
              onOpenCampaign();
            }}
            className="w-full rounded-bubble-xl text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
          >
            <GameTile
              tone="emerald"
              className="flex min-h-touch w-full items-center gap-2 px-2 py-2"
            >
              <GameIconWell
                size="sm"
                src="/icons/hub-mission.png"
                className="h-9 w-9"
              />
              <span className="relative min-w-0 flex-1 font-display text-xs font-black leading-tight text-white">
                {t("missions.tabPath")}
              </span>
            </GameTile>
          </button>
        )}
      </div>

      {activeNews && (
        <ActiveNewsChip
          key={activeNews.expiresAt}
          booster={activeNews}
          onOpen={onOpenNews}
          onExpired={onNewsExpired}
          compact
        />
      )}

      {campaignOpen && seasonOn && campaignSeason && hasCampaignBody && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden"
        >
          <CampaignSeasonCard
            season={campaignSeason}
            onOpenMissions={onOpenCampaign}
            embedded
            chaptersOnly
          />
        </motion.div>
      )}
    </section>
  );
}
