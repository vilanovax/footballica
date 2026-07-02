"use client";

import { useEffect, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ClubHomeBanner } from "@/components/ui/ClubHomeBanner";
import { HomeStreakBar } from "@/components/ui/HomeStreakBar";
import { HomeFeaturedMode } from "@/components/ui/HomeFeaturedMode";
import { useGame } from "@/lib/store";
import { faNum } from "@/lib/format";
import { levelInfo, leagueForXp, formatRegenCountdown, msUntilNextLife } from "@/lib/player";
import { featuredModeForDate, type FeaturedModeId } from "@/lib/home";

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
  badge,
  disabled,
  disabledBadge,
  onClick,
}: {
  title: string;
  subtitle: string;
  emoji: string;
  from: string;
  to: string;
  badge?: string;
  disabled?: boolean;
  disabledBadge?: string;
  onClick?: () => void;
}) {
  if (disabled) {
    return (
      <div className="home-mode-card--disabled relative overflow-hidden rounded-3xl p-4 text-right h-36 flex flex-col justify-end">
        {disabledBadge && (
          <span className="absolute top-3 right-3 rounded-full home-mode-soon-badge px-2.5 py-1 text-xs font-bold">
            {disabledBadge}
          </span>
        )}
        <span className="absolute top-3 left-3 text-3xl opacity-40 grayscale">{emoji}</span>
        <h3 className="text-lg font-extrabold text-white/45">{title}</h3>
        <p className="text-sm text-white/35">{subtitle}</p>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden rounded-3xl p-4 text-right h-36 flex flex-col justify-end active:scale-[0.97] transition-transform"
      style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}
    >
      {badge && (
        <span className="absolute top-3 right-3 rounded-full bg-black/25 px-2.5 py-1 text-xs font-bold">
          {badge}
        </span>
      )}
      <span className="absolute top-3 left-3 text-3xl drop-shadow">{emoji}</span>
      <h3 className="text-lg font-extrabold text-white">{title}</h3>
      <p className="text-sm text-white/80">{subtitle}</p>
    </button>
  );
}

function ResourcePill({
  children,
  title,
  accent,
}: {
  children: ReactNode;
  title?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`home-resource-pill rounded-2xl h-11 px-3 flex flex-col items-center justify-center shrink-0 ${
        accent ? "home-resource-pill--accent" : ""
      }`}
      title={title}
    >
      {children}
    </div>
  );
}

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
  const cards = useGame((s) => s.cards);
  const xp = useGame((s) => s.xp);
  const club = useGame((s) => s.club);
  const lives = useGame((s) => s.lives);
  const livesUpdatedAt = useGame((s) => s.livesUpdatedAt);
  const survivalBest = useGame((s) => s.survivalBest);
  const syncLives = useGame((s) => s.syncLives);
  const claimableMissions = useGame((s) => s.claimableMissions);
  const ensureDailyMissions = useGame((s) => s.ensureDailyMissions);

  const { level } = levelInfo(xp);
  const league = leagueForXp(xp);
  const regenIn = formatRegenCountdown(msUntilNextLife(lives, livesUpdatedAt));
  const canDuel = lives > 0;
  const featured = featuredModeForDate();

  useEffect(() => {
    syncLives();
    ensureDailyMissions();
    const t = setInterval(syncLives, 30_000);
    return () => clearInterval(t);
  }, [syncLives, ensureDailyMissions]);

  const missionBadge = claimableMissions();

  function playFeatured(id: FeaturedModeId) {
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

  return (
    <div className="pitch-stripes min-h-dvh pb-36">
      <header className="px-5 pt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenClub}
            className="flex items-center gap-3 flex-1 text-right active:scale-[0.98] transition-transform min-w-0"
          >
            <Avatar label={club.crest} color={club.color} size={52} />
            <div className="flex-1 min-w-0 text-right">
              <p className="text-lg font-extrabold leading-tight truncate text-white">
                {club.name} <span className="text-white/40 text-sm">›</span>
              </p>
              <p className="text-sm text-gold-400 font-bold truncate">
                ⭐ سطح {faNum(level)} · {league}
              </p>
            </div>
          </button>
          <ResourcePill
            title={regenIn && lives < 5 ? `جان بعدی: ${regenIn}` : "جان"}
          >
            <span className="font-extrabold leading-none text-sm whitespace-nowrap">
              ❤️ {faNum(lives)}/۵
            </span>
            {regenIn && lives < 5 && (
              <span className="text-[9px] text-white/45">{regenIn}</span>
            )}
          </ResourcePill>
          <ResourcePill title="کارت تاکتیکی" accent>
            <span className="font-extrabold leading-none text-sm whitespace-nowrap">
              🃏 {faNum(cards)}
            </span>
          </ResourcePill>
        </div>
      </header>

      <HomeStreakBar />

      {missionBadge > 0 ? (
        <button
          onClick={onOpenMissions}
          className="home-mission-banner mx-5 mt-3 w-[calc(100%-2.5rem)] rounded-2xl p-3.5 flex items-center gap-3 text-right active:scale-[0.98] transition-transform"
        >
          <span className="text-2xl shrink-0">🎯</span>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-white text-sm">
              {faNum(missionBadge)} ماموریت آمادهٔ دریافت
            </p>
            <p className="text-[11px] text-white/55 mt-0.5">جایزه بگیر · مسیر را ادامه بده</p>
          </div>
          <span className="home-mission-banner-badge rounded-xl px-3 py-1.5 text-sm font-extrabold shrink-0">
            {faNum(missionBadge)}
          </span>
        </button>
      ) : (
        <button
          onClick={onOpenMissions}
          className="mx-5 mt-3 w-[calc(100%-2.5rem)] rounded-xl py-2.5 text-sm font-bold text-white/60 text-center active:scale-[0.98] home-mission-link"
        >
          🎯 ماموریت‌ها و افتخارات ›
        </button>
      )}

      <HomeFeaturedMode
        mode={featured}
        disabled={featuredDisabled}
        disabledReason={featuredDisabledReason}
        onPlay={playFeatured}
      />

      <ClubHomeBanner onOpenClub={onOpenClub} />

      <div className="home-hero mx-5 mt-5 rounded-3xl p-6 relative overflow-hidden">
        <span className="absolute -left-6 -bottom-6 text-[9rem] opacity-15 leading-none pointer-events-none">
          ⚽
        </span>
        <p className="text-white/80 font-bold text-right">آماده‌ای؟</p>
        <h2 className="text-3xl font-extrabold text-white text-right mt-1">
          یک حریف پیدا کن
        </h2>
        <p className="mt-2 text-sm text-white/60 text-right">
          کویز سریع · رایگان · بدون مصرفِ جان
        </p>
        <button
          onClick={onPlayQuick}
          className="btn-gold mt-4 w-full rounded-2xl py-4 text-xl font-extrabold active:scale-[0.98] transition-transform"
        >
          ⚽ بازی سریع
        </button>
      </div>

      <div className="px-5 mt-7 mb-3 flex items-center justify-between">
        <button
          onClick={onOpenGames}
          className="text-sm text-gold-400 font-bold active:opacity-70"
        >
          همه ›
        </button>
        <h3 className="text-xl font-extrabold text-white">مودهای بازی</h3>
      </div>

      <div className="px-5 grid grid-cols-2 gap-3">
        <ModeCard
          title="حالت بمب"
          subtitle="قبل از انفجار جواب بده"
          emoji="💣"
          from="#e5473f"
          to="#a51f18"
          badge={featured.id === "bomb" ? "⭐ امروز" : undefined}
          onClick={onPlayBomb}
        />
        {canDuel ? (
          <ModeCard
            title="دوئل ۱به۱"
            subtitle="۵ سؤال · ۱ ❤️"
            emoji="⚔️"
            from="#2f6fed"
            to="#1b45a8"
            badge={featured.id === "duel" ? "⭐ امروز" : undefined}
            onClick={onPlayDuel}
          />
        ) : (
          <ModeCard
            title="دوئل ۱به۱"
            subtitle={regenIn ? `نیاز ۱ ❤️ · ${regenIn}` : "نیاز ۱ ❤️"}
            emoji="⚔️"
            from="#2f6fed"
            to="#1b45a8"
            disabled
            disabledBadge="بدون جان"
          />
        )}
        <ModeCard
          title="پنالتی"
          subtitle="۵ ضربه · گل یا مهار"
          emoji="🥅"
          from="#0f2018"
          to="#14301f"
          badge={featured.id === "penalty" ? "⭐ امروز" : undefined}
          onClick={onPlayPenalty}
        />
        <ModeCard
          title="مود بقا"
          subtitle={`رکورد: ${faNum(survivalBest)}`}
          emoji="💪"
          from="#3a1220"
          to="#5a1f2e"
          badge={featured.id === "survival" ? "⭐ امروز" : undefined}
          onClick={onPlaySurvival}
        />
      </div>

      <h3 className="px-5 mt-7 mb-3 text-xl font-extrabold text-right text-white/70">
        به‌زودی
      </h3>
      <div className="px-5 space-y-2.5">
        <ModeCard
          title="تورنمنت"
          subtitle="۳۲ نفر · جایزهٔ بزرگ"
          emoji="🏆"
          from="#8b3fe0"
          to="#5a1fa8"
          disabled
          disabledBadge="🔒 به‌زودی"
        />
        <div className="home-mode-card--disabled rounded-2xl p-4 flex items-center gap-3">
          <span className="text-3xl opacity-40 grayscale">👥</span>
          <div className="flex-1 text-right">
            <p className="font-extrabold text-white/45">دوئل آنلاین و بازی‌های در جریان</p>
            <p className="text-sm text-white/35 mt-0.5">
              رقابت زنده با بازیکنان واقعی — در نسخهٔ بعد
            </p>
          </div>
          <span className="home-mode-soon-badge rounded-xl px-3 py-1.5 text-xs font-bold shrink-0">
            🔒 به‌زودی
          </span>
        </div>
      </div>
    </div>
  );
}
