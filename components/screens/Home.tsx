"use client";

import { useEffect } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { OngoingRow, ONGOING_GAMES } from "@/components/ui/OngoingRow";
import { useGame } from "@/lib/store";
import { faNum, faCount } from "@/lib/format";
import { levelInfo, leagueForXp, formatRegenCountdown, msUntilNextLife } from "@/lib/player";

interface HomeProps {
  onPlayQuick: () => void;
  onOpenClub: () => void;
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
  onClick,
}: {
  title: string;
  subtitle: string;
  emoji: string;
  from: string;
  to: string;
  badge?: string;
  onClick?: () => void;
}) {
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

export function Home({
  onPlayQuick,
  onOpenClub,
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
  const streakDays = useGame((s) => s.streakDays);
  const survivalBest = useGame((s) => s.survivalBest);
  const syncLives = useGame((s) => s.syncLives);

  const { level } = levelInfo(xp);
  const league = leagueForXp(xp);
  const regenIn = formatRegenCountdown(msUntilNextLife(lives, livesUpdatedAt));

  useEffect(() => {
    syncLives();
    const t = setInterval(syncLives, 30_000);
    return () => clearInterval(t);
  }, [syncLives]);

  const streakDisplay = Math.min(streakDays, 7);

  return (
    <div className="pitch-stripes min-h-dvh pb-32">
      <header className="flex items-center gap-3 px-5 pt-6">
        <button
          onClick={onOpenClub}
          className="flex items-center gap-3 flex-1 text-right active:scale-[0.98] transition-transform min-w-0"
        >
          <Avatar label={club.crest} color={club.color} size={52} />
          <div className="flex-1 min-w-0 text-right">
            <p className="text-lg font-extrabold leading-tight truncate">
              {club.name} <span className="text-white/40 text-sm">›</span>
            </p>
            <p className="text-sm text-gold-400 font-bold truncate">
              ⭐ سطح {faNum(level)} · {league}
            </p>
          </div>
        </button>
        <div
          className="glass rounded-2xl h-11 px-3 flex flex-col items-center justify-center"
          title={regenIn ? `جان بعدی: ${regenIn}` : undefined}
        >
          <span className="font-extrabold leading-none text-sm">
            {faNum(lives)} ❤️
          </span>
          {regenIn && lives < 5 && (
            <span className="text-[9px] text-white/45">{regenIn}</span>
          )}
        </div>
        <div className="glass rounded-2xl h-11 px-3 flex items-center gap-1.5">
          <span className="font-extrabold leading-none">{faNum(cards)}</span>
          <span>⚡</span>
        </div>
      </header>

      <div className="mx-5 mt-4 rounded-2xl border border-gold-500/40 bg-gold-500/10 p-3 flex items-center gap-3">
        <div className="flex-1 text-right text-sm leading-6">
          {streakDays > 0 ? (
            <>
              🔥 <b>{faNum(streakDays)} روز پشت‌سرهم!</b> امروز هم بازی کن تا
              نشکند.
            </>
          ) : (
            <>🔥 امروز بازی کن و استریک را شروع کن.</>
          )}
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              className={`h-3 w-3 rounded-full ${
                i < streakDisplay ? "bg-gold-400" : "bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>

      <div
        className="mx-5 mt-5 rounded-3xl p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(150deg, #2f9e5f, #17683b)" }}
      >
        <span className="absolute -left-6 -bottom-6 text-[9rem] opacity-15 leading-none">
          ⚽
        </span>
        <p className="text-white/80 font-bold text-right">آماده‌ای؟</p>
        <h2 className="text-3xl font-extrabold text-white text-right mt-1">
          یک حریف پیدا کن
        </h2>
        <button
          onClick={onPlayQuick}
          className="btn-gold mt-5 w-full rounded-2xl py-4 text-xl font-extrabold"
        >
          ⚡ بازی سریع {lives <= 0 ? "· بدون جان" : ""}
        </button>
      </div>

      <h3 className="px-5 mt-7 mb-3 text-xl font-extrabold text-right">
        مودهای بازی
      </h3>
      <div className="px-5 grid grid-cols-2 gap-3">
        <ModeCard
          title="حالت بمب"
          subtitle="قبل از انفجار جواب بده"
          emoji="💣"
          from="#e5473f"
          to="#a51f18"
          badge="🔥 داغ"
          onClick={onPlayBomb}
        />
        <ModeCard
          title="دوئل ۱به۱"
          subtitle="۵ سؤال · ۱ جان"
          emoji="⚔️"
          from="#2f6fed"
          to="#1b45a8"
          onClick={onPlayDuel}
        />
        <ModeCard
          title="تورنمنت"
          subtitle="۳۲ نفر، جایزهٔ بزرگ"
          emoji="🏆"
          from="#8b3fe0"
          to="#5a1fa8"
          badge="۲ روز مانده"
        />
        <ModeCard
          title="تک‌نفره"
          subtitle="تمرین و کسب XP"
          emoji="🎯"
          from="#2f9e5f"
          to="#17683b"
          onClick={onPlayQuick}
        />
      </div>

      <button
        onClick={onPlayPenalty}
        className="mx-5 mt-3 flex w-[calc(100%-2.5rem)] items-center gap-3 overflow-hidden rounded-3xl p-4 text-right active:scale-[0.98] transition"
        style={{ background: "linear-gradient(105deg,#0f2018,#14301f)" }}
      >
        <span className="text-5xl">🥅</span>
        <div className="flex-1 text-right">
          <h3 className="text-lg font-extrabold text-white">پنالتی</h3>
          <p className="text-sm text-white/70">۵ ضربه · درست = گل، غلط = مهار</p>
        </div>
        <span className="rounded-xl bg-gold-400 px-3 py-2 text-sm font-extrabold text-[#3a2600]">
          شوت بزن
        </span>
      </button>

      <button
        onClick={onPlaySurvival}
        className="mx-5 mt-3 flex w-[calc(100%-2.5rem)] items-center gap-3 overflow-hidden rounded-3xl p-4 text-right active:scale-[0.98] transition"
        style={{ background: "linear-gradient(105deg,#3a1220,#5a1f2e)" }}
      >
        <span className="text-5xl">❤️</span>
        <div className="flex-1 text-right">
          <h3 className="text-lg font-extrabold text-white">مود بقا</h3>
          <p className="text-sm text-white/70">
            تا آخرین جان جواب بده · 🏅 رکورد: {faNum(survivalBest)}
          </p>
        </div>
        <span className="rounded-xl bg-gold-400 px-3 py-2 text-sm font-extrabold text-[#3a2600]">
          شروع
        </span>
      </button>

      <div className="px-5 mt-7 mb-3 flex items-center justify-between">
        <button
          onClick={onOpenGames}
          className="text-sm text-gold-400 font-bold active:opacity-70"
        >
          همه ›
        </button>
        <h3 className="text-xl font-extrabold">بازی‌های در جریان</h3>
      </div>
      <div className="px-5 space-y-2.5">
        {ONGOING_GAMES.slice(0, 3).map((g) => (
          <OngoingRow key={g.name} {...g} />
        ))}
      </div>
    </div>
  );
}
