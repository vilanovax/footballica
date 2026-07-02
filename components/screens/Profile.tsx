"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useGame } from "@/lib/store";
import { faNum, faCount } from "@/lib/format";
import { levelInfo, leagueForXp } from "@/lib/player";
import { CLUB } from "@/lib/club";

interface ProfileProps {
  onOpenClub: () => void;
  onOpenMissions: () => void;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="home-resource-pill rounded-2xl py-3 text-center">
      <p className="text-xl font-extrabold leading-none">{value}</p>
      <p className="mt-1.5 text-xs text-white/55">{label}</p>
    </div>
  );
}

export function Profile({ onOpenClub, onOpenMissions }: ProfileProps) {
  const cards = useGame((s) => s.cards);
  const xp = useGame((s) => s.xp);
  const fans = useGame((s) => s.fans);
  const streakDays = useGame((s) => s.streakDays);
  const totalCorrect = useGame((s) => s.totalCorrect);
  const club = useGame((s) => s.club);
  const claimableMissions = useGame((s) => s.claimableMissions);
  const resetSave = useGame((s) => s.resetSave);

  const { level, into, need, pct } = levelInfo(xp);
  const league = leagueForXp(xp);
  const missionBadge = claimableMissions();

  return (
    <div className="pitch-stripes min-h-dvh pb-32">
      <header className="px-5 pt-8 flex flex-col items-center text-center">
        <Avatar label={club.crest} color={club.color} size={88} />
        <h1 className="mt-3 text-2xl font-extrabold">{club.name}</h1>
        <span className="mt-1 rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-sm font-bold text-gold-400">
          ⭐ سطح {faNum(level)} · {league}
        </span>
        <div className="mt-4 w-full max-w-xs">
          <div className="flex justify-between text-xs text-white/50 mb-1">
            <span>
              {faNum(into)} / {faNum(need)} XP
            </span>
            <span>سطح {faNum(level + 1)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full bg-gold-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </header>

      <div className="px-5 mt-6 grid grid-cols-3 gap-3">
        <Stat value={`${faNum(cards)} 🃏`} label="کارت تاکتیکی" />
        <Stat value={`${faCount(fans)} 🎽`} label="هوادار" />
        <Stat value={`${faNum(streakDays)} 🔥`} label="استریک" />
      </div>

      <div className="px-5 mt-4 space-y-3">
        <button
          onClick={onOpenMissions}
          className={`w-full rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition text-right ${
            missionBadge > 0 ? "home-mission-banner" : "home-resource-pill"
          }`}
        >
          <span className="text-3xl shrink-0">🎯</span>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold">ماموریت‌ها و افتخارات</p>
            <p className="text-sm text-white/55">
              {missionBadge > 0
                ? `${faNum(missionBadge)} جایزه آماده`
                : `${faNum(totalCorrect)} جواب درست · پیشرفت را ببین`}
            </p>
          </div>
          {missionBadge > 0 ? (
            <span className="home-mission-banner-badge rounded-xl px-3 py-1.5 text-sm font-extrabold shrink-0">
              {faNum(missionBadge)}
            </span>
          ) : (
            <span className="text-white/40 text-xl shrink-0">›</span>
          )}
        </button>

        <button
          onClick={onOpenClub}
          className="w-full home-resource-pill rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition"
        >
          <Avatar label={club.crest} color={club.color} size={48} />
          <div className="flex-1 text-right">
            <p className="font-extrabold">باشگاه من</p>
            <p className="text-sm text-white/55">
              {CLUB.division} · {faCount(fans)} هوادار
            </p>
          </div>
          <span className="text-white/40 text-xl">›</span>
        </button>
      </div>

      <button
        onClick={() => {
          if (confirm("پیشرفتت پاک شود و از اول شروع کنی؟")) resetSave();
        }}
        className="mx-5 mt-8 w-[calc(100%-2.5rem)] rounded-2xl bg-team-foe/15 py-3 text-sm font-bold text-team-foe"
      >
        شروعِ دوباره (ریستِ پیشرفت)
      </button>
    </div>
  );
}
