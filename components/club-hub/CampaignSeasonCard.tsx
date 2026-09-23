"use client";

import Link from "next/link";
import type { CampaignSeasonView } from "@/lib/game/campaignSeason";
import { campaignSeasonActive } from "@/lib/game/campaignSeason";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { playSound } from "@/lib/audio/SoundManager";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { cn } from "@/lib/utils";

type Props = {
  season: CampaignSeasonView;
  onOpenMissions: () => void;
  /** Nested under Today rail — quieter club chrome, no entrance motion. */
  embedded?: boolean;
  /**
   * When nested under the Today rail chip: skip the duplicated title/progress
   * header and only show chapters (or a claim CTA).
   */
  chaptersOnly?: boolean;
};

/**
 * Hub Campaign pillar — quest-path panel with glanceable progress.
 * CSS transitions only — keeps Framer off the Club secondary stream.
 */
export function CampaignSeasonCard({
  season,
  onOpenMissions,
  embedded = false,
  chaptersOnly = false,
}: Props) {
  const { t, locale } = useTranslation();

  if (!campaignSeasonActive(season)) return null;

  const missionPct =
    season.missionsTotal > 0
      ? Math.round((season.missionsDone / season.missionsTotal) * 100)
      : 0;
  const chapterPct =
    season.chapters.length > 0
      ? Math.round(
          (season.chaptersConquered / season.chapters.length) * 100,
        )
      : 0;
  const rewardReady = season.chestReady || season.claimableCount > 0;
  const batchLabel =
    season.batchIndex != null
      ? t("campaign.batch", {
          n: toLocaleDigits(season.batchIndex, locale),
        })
      : t("campaign.seasonLive");

  return (
    <section
      className={cn(!(embedded || chaptersOnly) && "animate-status-sheet-rise")}
    >
      <GamePanel
        tone={rewardReady ? "amber" : "emerald"}
        className={cn(chaptersOnly && "shadow-arena-ring")}
      >
      {rewardReady && !chaptersOnly && (
        <div
          aria-hidden
          className="pointer-events-none absolute -end-10 top-0 h-28 w-28 animate-pulse rounded-full bg-amber-300/30 blur-2xl"
        />
      )}

      {!chaptersOnly && (
        <button
          type="button"
          onClick={() => {
            playSound("click");
            haptic(HAPTIC.light);
            onOpenMissions();
          }}
          className={[
            "relative flex w-full flex-col text-start transition-transform active:scale-[0.99]",
            embedded ? "gap-2.5 p-3" : "gap-3 p-3.5",
          ].join(" ")}
        >
          <div className="flex items-center gap-3">
            <span
              className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-black/35 shadow-[0_0_0_1px_rgba(255,255,255,0.25),0_3px_0_0_rgba(0,0,0,0.35)]"
              aria-hidden
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/trophy.png"
                alt=""
                draggable={false}
                className="h-8 w-8 object-contain"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[10px] font-black text-emerald-200/85">
                {t("campaign.eyebrow")}
              </p>
              <h2 className="font-display text-sm font-black leading-tight text-white drop-shadow-sm">
                {t("campaign.title")}
              </h2>
              <p className="mt-0.5 truncate font-display text-[11px] font-bold text-white/65">
                {batchLabel}
                {rewardReady ? (
                  <span className="ms-1.5 text-amber-200">
                    · {t("campaign.rewardsReady")}
                  </span>
                ) : null}
              </p>
            </div>
            <span
              className={[
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_3px_0_0_rgba(0,0,0,0.35)]",
                rewardReady
                  ? "bg-accent shadow-[0_0_0_1px_rgba(252,211,77,0.55),0_3px_0_0_rgba(0,0,0,0.35)]"
                  : "bg-black/30",
              ].join(" ")}
              aria-label={t("campaign.openPath")}
              title={t("campaign.openPath")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/hub-mission.png"
                alt=""
                draggable={false}
                className="h-7 w-7 object-contain"
              />
            </span>
          </div>

          {season.missionsTotal > 0 && (
            <div className="rounded-xl border border-white/12 bg-black/30 px-2.5 py-2">
              <div className="mb-1.5 flex items-center justify-between font-display text-[10px] font-black">
                <span className="text-white/60">
                  {t("campaign.missionsProgress")}
                </span>
                <span className="tabular-nums text-white">
                  {toLocaleDigits(season.missionsDone, locale)}/
                  {toLocaleDigits(season.missionsTotal, locale)}
                  <span className="ms-1.5 text-emerald-200/90">
                    {toLocaleDigits(missionPct, locale)}%
                  </span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/45 ring-1 ring-white/12">
                <div
                  className="relative h-full rounded-full bg-linear-to-r from-emerald-400 to-lime-300 transition-[width] duration-300 ease-out"
                  style={{ width: `${missionPct}%` }}
                />
              </div>
            </div>
          )}
        </button>
      )}

      {chaptersOnly && rewardReady && (
        <button
          type="button"
          onClick={() => {
            playSound("click");
            haptic(HAPTIC.light);
            onOpenMissions();
          }}
          className="relative flex w-full items-center gap-2.5 border-b border-white/12 px-3 py-2.5 text-start active:bg-white/5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent shadow-[0_2px_0_0_rgba(0,0,0,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/gift.png"
              alt=""
              draggable={false}
              className="h-6 w-6 object-contain"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-sm font-black text-amber-100">
              {t("campaign.rewardsReady")}
            </span>
            <span className="block font-display text-[11px] font-bold text-white/60">
              {t("campaign.openPath")}
            </span>
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/back.png"
            alt=""
            aria-hidden
            className="h-4 w-4 shrink-0 rotate-180 object-contain opacity-80 rtl:rotate-0"
          />
        </button>
      )}

      {season.chapters.length > 0 && (
        <div
          className={[
            "relative px-3.5 pb-3.5 pt-3",
            chaptersOnly ? "" : "border-t border-white/12",
          ].join(" ")}
        >
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <p className="font-display text-[10px] font-black text-white/65">
              {t("campaign.chapters")}
            </p>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-black/45 ring-1 ring-white/10">
                <div
                  className="h-full rounded-full bg-linear-to-r from-emerald-400 to-lime-300 transition-[width] duration-300 ease-out"
                  style={{ width: `${chapterPct}%` }}
                />
              </div>
              <p className="font-display text-[11px] font-black tabular-nums text-white/75">
                {toLocaleDigits(season.chaptersConquered, locale)}/
                {toLocaleDigits(season.chapters.length, locale)}
              </p>
            </div>
          </div>

          <ul className="flex flex-col gap-1.5">
            {season.chapters.slice(0, 3).map((ch, i) => {
              const title = locale === "fa" ? ch.titleFa : ch.titleEn;
              const statusLabel = ch.conquered
                ? t("campaign.chapterDone")
                : ch.unlocked
                  ? t("campaign.chapterPlay")
                  : t("campaign.chapterLocked");
              return (
                <li key={ch.id}>
                  <Link
                    href={`/play/survival?challenge=${encodeURIComponent(ch.id)}`}
                    onClick={() => playSound("click")}
                    aria-label={`${title} — ${statusLabel}`}
                    className={[
                      "flex min-h-touch items-center gap-2.5 rounded-2xl px-2.5 py-2 shadow-[0_3px_0_0_rgba(0,0,0,0.28)] transition-transform active:translate-y-px active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
                      ch.conquered
                        ? "bg-emerald-950/55 shadow-[0_0_0_1px_rgba(52,211,153,0.4),0_3px_0_0_rgba(0,0,0,0.28)]"
                        : ch.unlocked
                          ? "bg-black/40 shadow-[0_0_0_1px_rgba(255,255,255,0.22),0_3px_0_0_rgba(0,0,0,0.28)]"
                          : "bg-black/25 opacity-70 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-sm font-black ring-1",
                        ch.conquered
                          ? "bg-emerald-500/20 text-emerald-100 ring-emerald-300/30"
                          : ch.unlocked
                            ? "bg-black/45 text-white ring-white/20"
                            : "bg-black/30 text-white/50 ring-white/10",
                      ].join(" ")}
                      aria-hidden
                    >
                      {ch.conquered
                        ? // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src="/icons/medal-gold.png"
                            alt=""
                            draggable={false}
                            className="h-6 w-6 object-contain"
                          />
                        : toLocaleDigits(i + 1, locale)}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-display text-sm font-black text-white drop-shadow-sm">
                      {title}
                    </span>
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center"
                      aria-hidden
                      title={statusLabel}
                    >
                      {ch.conquered ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src="/icons/done.png"
                          alt=""
                          draggable={false}
                          className="h-8 w-8 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
                        />
                      ) : ch.unlocked ? (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[0_3px_0_0_rgba(0,0,0,0.4)]">
                          <span className="ms-0.5 font-display text-sm font-black" aria-hidden>
                            ▶
                          </span>
                        </span>
                      ) : (
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/50 shadow-[0_0_0_1px_rgba(255,255,255,0.15)]"
                          aria-hidden
                        >
                          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
                            <path d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3Zm1.5 5h-3V4a1.5 1.5 0 1 1 3 0v2Z" />
                          </svg>
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {season.chapters.length > 3 && (
            <Link
              href="/play/survival"
              className="mt-2.5 block text-center font-display text-xs font-black text-amber-200/95"
            >
              {t("campaign.moreChapters", {
                n: toLocaleDigits(season.chapters.length - 3, locale),
              })}
            </Link>
          )}
        </div>
      )}
      </GamePanel>
    </section>
  );
}
