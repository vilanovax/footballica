"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useGame } from "@/lib/store";
import { faNum, faCount } from "@/lib/format";
import { PLAYER } from "@/lib/types";
import { CLUB } from "@/lib/club";

interface ProfileProps {
  onOpenClub: () => void;
}

interface Achievement {
  emoji: string;
  title: string;
  have: number;
  need: number;
}

const ACHIEVEMENTS: Achievement[] = [
  { emoji: "⚽", title: "۱۰۰ گلِ درست", have: 68, need: 100 },
  { emoji: "🔥", title: "هت‌تریکِ استریک (۳ روز)", have: 4, need: 3 },
  { emoji: "🏆", title: "فاتحِ دستهٔ دو", have: 2100, need: 3000 },
  { emoji: "💣", title: "۲۰ جواب در حالت بمب", have: 12, need: 20 },
];

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass rounded-2xl py-3 text-center">
      <p className="text-xl font-extrabold leading-none">{value}</p>
      <p className="mt-1.5 text-xs text-white/55">{label}</p>
    </div>
  );
}

export function Profile({ onOpenClub }: ProfileProps) {
  const coins = useGame((s) => s.coins);
  const cards = useGame((s) => s.cards);
  const club = useGame((s) => s.club);
  const resetSave = useGame((s) => s.resetSave);

  return (
    <div className="pitch-stripes min-h-dvh pb-32">
      {/* کارتِ بازیکن */}
      <header className="px-5 pt-8 flex flex-col items-center text-center">
        <Avatar label="تو" color="you" size={88} />
        <h1 className="mt-3 text-2xl font-extrabold">{PLAYER.name}</h1>
        <span className="mt-1 rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-sm font-bold text-gold-400">
          ⭐ سطح {faNum(PLAYER.level)} · {PLAYER.league}
        </span>
      </header>

      {/* آمار */}
      <div className="px-5 mt-6 grid grid-cols-3 gap-3">
        <Stat value={`${faCount(coins)} 🪙`} label="سکه" />
        <Stat value={`${faNum(cards)} ⚡`} label="کارت" />
        <Stat value={`${faNum(PLAYER.streakDays)} 🔥`} label="استریک" />
      </div>

      {/* باشگاه من */}
      <button
        onClick={onOpenClub}
        className="mx-5 mt-4 w-[calc(100%-2.5rem)] glass rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition"
      >
        <Avatar label={club.crest} color={club.color} size={48} />
        <div className="flex-1 text-right">
          <p className="font-extrabold">{club.name}</p>
          <p className="text-sm text-white/55">
            {CLUB.division} · رتبهٔ {faNum(CLUB.rank)}
          </p>
        </div>
        <span className="text-white/40 text-xl">›</span>
      </button>

      {/* اچیومنت‌ها */}
      <h3 className="px-5 mt-7 mb-3 text-xl font-extrabold text-right">
        اچیومنت‌ها
      </h3>
      <div className="px-5 space-y-3">
        {ACHIEVEMENTS.map((a) => {
          const done = a.have >= a.need;
          const pct = Math.min(100, (a.have / a.need) * 100);
          return (
            <div key={a.title} className="glass rounded-2xl p-3 flex items-center gap-3">
              <span className={`text-3xl ${done ? "" : "grayscale opacity-60"}`}>
                {a.emoji}
              </span>
              <div className="flex-1 text-right">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white/55">
                    {done ? "✓ کامل" : `${faNum(a.have)}/${faNum(a.need)}`}
                  </span>
                  <p className="font-bold">{a.title}</p>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gold-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ریستِ ذخیره (تست) */}
      <button
        onClick={() => {
          if (confirm("پیشرفتت پاک شود و از اول شروع کنی؟")) resetSave();
        }}
        className="mx-5 mt-6 w-[calc(100%-2.5rem)] rounded-2xl bg-team-foe/15 py-3 text-sm font-bold text-team-foe"
      >
        شروعِ دوباره (ریستِ پیشرفت)
      </button>
    </div>
  );
}
