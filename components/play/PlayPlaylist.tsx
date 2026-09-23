"use client";

import Link from "next/link";
import type { PlayPlaylistItem } from "@/lib/play/buildPlaylist";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { playSound } from "@/lib/audio/SoundManager";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { cn } from "@/lib/utils";

type PlayPlaylistProps = {
  items: PlayPlaylistItem[];
  /** Live challenge count — shown on the challenge chip. */
  liveChallengeCount?: number;
  /** Kept for call-site compatibility; your-turn lives on DuelInboxBanner. */
  inboxCount?: number;
};

const ITEM_ICON: Record<PlayPlaylistItem["id"], string> = {
  live_challenge: "/icons/trophy.png",
  beat_record: "/icons/streak.png",
  play_penalty: "/icons/nav-ball.png",
  new_duel: "/icons/target.png",
};

/**
 * Soft Recommended row — routes into existing modes, never invents cards.
 */
export function PlayPlaylist({
  items,
  liveChallengeCount = 0,
}: PlayPlaylistProps) {
  const { t, locale } = useTranslation();
  if (items.length === 0) return null;

  return (
    <div className="hub-deck flex flex-col gap-2">
      <h2 className="px-0.5 font-display text-xs font-black text-arena-muted">
        {t("play.groupRecommended")}
      </h2>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const title = t(`play.playlist.${item.id}.title`);
          const blurb =
            item.id === "live_challenge"
              ? t("play.playlist.live_challenge.blurb", {
                  n: toLocaleDigits(liveChallengeCount, locale),
                })
              : t(`play.playlist.${item.id}.blurb`);
          const hot = item.id === "live_challenge";

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => playSound("click")}
              className={cn(
                "block rounded-(--radius-bubble-xl) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring",
              )}
            >
              <GamePanel
                tone={hot ? "amber" : "emerald"}
                className="flex min-h-14 items-center gap-3 px-3 py-2.5"
              >
                <GameIconWell
                  size="md"
                  src={ITEM_ICON[item.id]}
                  className="h-11 w-11"
                  iconClassName="h-7 w-7"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate font-display text-sm font-black text-white">
                      {title}
                    </p>
                    {i === 0 && (
                      <GameChip tone="amber" className="text-[10px]">
                        {t("play.playlistTop")}
                      </GameChip>
                    )}
                  </div>
                  <p className="mt-0.5 truncate font-display text-xs font-bold text-white/65">
                    {blurb}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="font-display text-lg font-black text-white/50"
                >
                  {locale === "fa" ? "‹" : "›"}
                </span>
              </GamePanel>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
