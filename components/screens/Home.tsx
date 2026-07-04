"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ClubBankSheet } from "@/components/ui/ClubBankSheet";
import { ClubHomeBanner } from "@/components/ui/ClubHomeBanner";
import { HomeStreakBar } from "@/components/ui/HomeStreakBar";
import { HomeFeaturedMode } from "@/components/ui/HomeFeaturedMode";
import { HomeMissionBanner } from "@/components/ui/HomeMissionBanner";
import { MODE_THEME_MAP } from "@/lib/designSystem";
import { useGame } from "@/lib/store";
import { faNum, faVaultM } from "@/lib/format";
import { levelInfo, leagueForXp, formatRegenCountdown, msUntilNextLife } from "@/lib/player";
import { featuredModeForDate, type FeaturedModeId } from "@/lib/home";
import { vaultCapacity, isBank } from "@/lib/vault";

interface HomeProps {
  onPlayQuick: () => void;
  onOpenClub: () => void;
  onOpenMissions: () => void;
  onPlayBomb: () => void;
  onOpenGames: () => void;
  onPlayDuel: () => void;
  onPlayPenalty: () => void;
  onPlaySurvival: () => void;
}

function ModeCard({
  title,
  subtitle,
  emoji,
  from,
  to,
  disabled,
  disabledBadge,
  onClick,
}: {
  title: string;
  subtitle: string;
  emoji: string;
  from: string;
  to: string;
  disabled?: boolean;
  disabledBadge?: string;
  onClick?: () => void;
}) {
  if (disabled) {
    return (
      <div className="home-mode-card--disabled relative overflow-hidden rounded-2xl p-3.5 text-right h-28 flex flex-col justify-end">
        {disabledBadge && (
          <span className="absolute top-2.5 right-2.5 rounded-full home-mode-soon-badge px-2 py-0.5 text-[10px] font-bold">
            {disabledBadge}
          </span>
        )}
        <span className="absolute top-2.5 left-2.5 text-2xl opacity-40 grayscale">{emoji}</span>
        <h3 className="text-base font-extrabold text-white/45">{title}</h3>
        <p className="text-[11px] text-white/35">{subtitle}</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl p-3.5 text-right h-28 flex flex-col justify-end active:scale-[0.97] transition-transform"
      style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}
    >
      <span className="absolute top-2.5 left-2.5 text-2xl drop-shadow">{emoji}</span>
      <h3 className="text-base font-extrabold text-white">{title}</h3>
      <p className="text-[11px] text-white/80">{subtitle}</p>
    </button>
  );
}

const MODE_DEFS = [
  {
    id: "bomb" as const,
    title: "حالت بمب",
    subtitle: "سرعتی · XP بیشتر",
    emoji: MODE_THEME_MAP.bomb.emoji,
    from: MODE_THEME_MAP.bomb.from,
    to: MODE_THEME_MAP.bomb.to,
    play: "bomb" as const,
  },
  {
    id: "duel" as const,
    title: "دوئل ۱به۱",
    subtitle: "۵ سؤال · ۱ ❤️",
    emoji: MODE_THEME_MAP.duel.emoji,
    from: MODE_THEME_MAP.duel.from,
    to: MODE_THEME_MAP.duel.to,
    play: "duel" as const,
  },
  {
    id: "penalty" as const,
    title: "پنالتی",
    subtitle: "۵ ضربه · بدون جان",
    emoji: MODE_THEME_MAP.penalty.emoji,
    from: MODE_THEME_MAP.penalty.from,
    to: MODE_THEME_MAP.penalty.to,
    play: "penalty" as const,
  },
  {
    id: "survival" as const,
    title: "مود بقا",
    subtitle: "بدون جان · رکورد",
    emoji: MODE_THEME_MAP.survival.emoji,
    from: MODE_THEME_MAP.survival.from,
    to: MODE_THEME_MAP.survival.to,
    play: "survival" as const,
  },
] as const;

export function Home({
  onPlayQuick,
  onOpenClub,
  onOpenMissions,
  onPlayBomb,
  onOpenGames,
  onPlayDuel,
  onPlayPenalty,
  onPlaySurvival,
}: HomeProps) {
  const [bankOpen, setBankOpen] = useState(false);

  const cards = useGame((s) => s.cards);
  const budget = useGame((s) => s.budget);
  const vaultLevel = useGame((s) => s.vaultLevel);
  const xp = useGame((s) => s.xp);
  const club = useGame((s) => s.club);
  const lives = useGame((s) => s.lives);
  const livesUpdatedAt = useGame((s) => s.livesUpdatedAt);
  const survivalBest = useGame((s) => s.survivalBest);
  const syncLives = useGame((s) => s.syncLives);
  const ensureDailyMissions = useGame((s) => s.ensureDailyMissions);

  const { level } = levelInfo(xp);
  const league = leagueForXp(xp);
  const regenIn = formatRegenCountdown(msUntilNextLife(lives, livesUpdatedAt));
  const canDuel = lives > 0;
  const featured = featuredModeForDate();
  const bank = isBank(vaultLevel);
  const safeBudget = Number.isFinite(budget) ? budget : 0;
  const vaultCap = vaultCapacity(vaultLevel);

  useEffect(() => {
    syncLives();
    ensureDailyMissions();
    const t = setInterval(syncLives, 30_000);
    return () => clearInterval(t);
  }, [syncLives, ensureDailyMissions]);

  function playFeatured(id: FeaturedModeId) {
    if (id === "bomb") onPlayBomb();
    else if (id === "duel") onPlayDuel();
    else if (id === "penalty") onPlayPenalty();
    else onPlaySurvival();
  }

  function playMode(id: (typeof MODE_DEFS)[number]["play"]) {
    if (id === "bomb") onPlayBomb();
    else if (id === "duel") onPlayDuel();
    else if (id === "penalty") onPlayPenalty();
    else onPlaySurvival();
  }

  const featuredDisabled = featured.id === "duel" && !canDuel;
  const featuredDisabledReason =
    featured.id === "duel" && !canDuel
      ? regenIn
        ? `نیاز ۱ ❤️ · ${regenIn}`
        : "نیاز ۱ ❤️"
      : undefined;

  const gridModes = MODE_DEFS.filter((m) => m.id !== featured.id);

  return (
    <div className="pitch-stripes min-h-dvh pb-32">
      <header className="px-5 pt-5">
        <button
          type="button"
          onClick={onOpenClub}
          className="flex items-center gap-3 w-full text-right active:scale-[0.98] transition-transform"
        >
          <Avatar label={club.crest} color={club.color} size={48} />
          <div className="flex-1 min-w-0">
            <p className="text-lg font-extrabold leading-tight truncate text-white">
              {club.name}
            </p>
            <p className="text-xs text-gold-400 font-bold truncate mt-0.5">
              سطح {faNum(level)} · {league}
            </p>
          </div>
        </button>

        <div className="mt-3 flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => setBankOpen(true)}
            className="home-header-stat flex-1 min-w-0 rounded-xl px-2.5 py-2 text-right active:scale-[0.98]"
          >
            <p className="text-[9px] font-bold text-white/40">خزانه</p>
            <p className="text-xs font-extrabold text-gold-400 tabular-nums truncate">
              {bank ? (
                <>🏦 {faVaultM(safeBudget)}م+</>
              ) : (
                <>
                  🔐 {faVaultM(safeBudget)}/{faVaultM(vaultCap)}م
                </>
              )}
            </p>
          </button>
          <div className="home-header-stat rounded-xl px-2.5 py-2 text-center shrink-0 min-w-13">
            <p className="text-[9px] font-bold text-white/40">کارت</p>
            <p className="text-xs font-extrabold">🃏 {faNum(cards)}</p>
          </div>
          <div
            className="home-header-stat rounded-xl px-2.5 py-2 text-center shrink-0 min-w-13"
            title={regenIn && lives < 5 ? `جان بعدی: ${regenIn}` : undefined}
          >
            <p className="text-[9px] font-bold text-white/40">جان</p>
            <p className="text-xs font-extrabold">
              ❤️ {faNum(lives)}/۵
            </p>
          </div>
        </div>
      </header>

      <ClubBankSheet open={bankOpen} onClose={() => setBankOpen(false)} />

      <HomeMissionBanner onOpenMissions={onOpenMissions} />

      <div className="home-hero home-hero--primary mx-5 mt-4 rounded-3xl p-5 relative overflow-hidden">
        <span className="absolute -left-4 -bottom-4 text-[7rem] opacity-12 leading-none pointer-events-none">
          ⚽
        </span>
        <h2 className="text-2xl font-extrabold text-white text-right relative">
          شروع سریع
        </h2>
        <p className="mt-1.5 text-sm text-white/70 text-right relative">
          کویز تک‌نفره · رایگان · بدون مصرف جان
        </p>
        <button
          type="button"
          onClick={onPlayQuick}
          className="btn-gold relative mt-4 w-full rounded-2xl py-3.5 text-lg font-extrabold active:scale-[0.98] transition-transform"
        >
          ⚽ شروع بازی
        </button>
      </div>

      <HomeFeaturedMode
        mode={featured}
        disabled={featuredDisabled}
        disabledReason={featuredDisabledReason}
        onPlay={playFeatured}
      />

      <ClubHomeBanner onOpenClub={onOpenClub} />

      <HomeStreakBar />

      <div className="px-5 mt-6 mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenGames}
          className="text-xs text-gold-400 font-bold active:opacity-70"
        >
          همه ›
        </button>
        <h3 className="text-base font-extrabold text-white">مودهای بازی</h3>
      </div>

      <div className="px-5 grid grid-cols-2 gap-2.5">
        {gridModes.map((m) => {
          const subtitle =
            m.id === "survival"
              ? `بدون جان · رکورد ${faNum(survivalBest)}`
              : m.id === "duel" && !canDuel
                ? regenIn
                  ? `نیاز ۱ ❤️ · ${regenIn}`
                  : "نیاز ۱ ❤️"
                : m.subtitle;

          if (m.id === "duel" && !canDuel) {
            return (
              <ModeCard
                key={m.id}
                title={m.title}
                subtitle={subtitle}
                emoji={m.emoji}
                from={m.from}
                to={m.to}
                disabled
                disabledBadge="بدون جان"
              />
            );
          }

          return (
            <ModeCard
              key={m.id}
              title={m.title}
              subtitle={subtitle}
              emoji={m.emoji}
              from={m.from}
              to={m.to}
              onClick={() => playMode(m.play)}
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={onOpenGames}
        className="home-soon-link mx-5 mt-5 mb-2 w-[calc(100%-2.5rem)] rounded-xl py-3 text-center text-xs font-bold text-white/38 active:opacity-70"
      >
        🔒 تورنمنت و رقابت آنلاین — به‌زودی ›
      </button>
    </div>
  );
}
