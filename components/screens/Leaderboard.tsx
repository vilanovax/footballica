"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useGame } from "@/lib/store";
import { faNum, faCount } from "@/lib/format";
import { leagueForXp } from "@/lib/player";

interface Row {
  rank: number;
  name: string;
  short: string;
  points: number;
  color: string;
  you?: boolean;
}

const BASE_ROWS: Omit<Row, "name" | "points" | "you">[] = [
  { rank: 1, short: "س.ک", color: "foe" },
  { rank: 2, short: "ز.ر", color: "#8b3fe0" },
  { rank: 3, short: "م.ا", color: "#e08a2f" },
  { rank: 4, short: "تو", color: "you" },
  { rank: 5, short: "ع.ن", color: "foe" },
  { rank: 6, short: "ن.ص", color: "#2f9e5f" },
  { rank: 7, short: "ر.ح", color: "foe" },
  { rank: 8, short: "س.م", color: "#8b3fe0" },
  { rank: 9, short: "ک.ر", color: "#2f9e5f" },
  { rank: 10, short: "ل.ک", color: "foe" },
];

const MOCK_NAMES = [
  "سینا کریمی",
  "زهرا رضایی",
  "مهدی احمدی",
  "",
  "علی نوری",
  "نگار صادقی",
  "رضا حریف",
  "سارا محمدی",
  "کیان رستمی",
  "لیلا کاظمی",
];

const MOCK_POINTS = [4820, 4510, 4180, 0, 3720, 3400, 3120, 2890, 2610, 2350];

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function Zone({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 py-1 text-xs font-bold" style={{ color }}>
      <span className="h-px flex-1" style={{ background: color, opacity: 0.4 }} />
      {label}
      <span className="h-px flex-1" style={{ background: color, opacity: 0.4 }} />
    </div>
  );
}

export function Leaderboard() {
  const club = useGame((s) => s.club);
  const xp = useGame((s) => s.xp);
  const league = leagueForXp(xp);

  const rows: Row[] = BASE_ROWS.map((r, i) => ({
    ...r,
    name: i === 3 ? club.name : MOCK_NAMES[i],
    points: i === 3 ? xp : MOCK_POINTS[i],
    you: i === 3,
  }));

  return (
    <div className="pitch-stripes min-h-dvh pb-32">
      <header className="px-5 pt-6 text-right">
        <h1 className="text-2xl font-extrabold">رده‌بندی هفتگی</h1>
        <div className="mt-2 flex items-center justify-between">
          <span className="rounded-lg bg-white/10 px-3 py-1 text-sm font-bold text-white/70">
            ⏳ ۳ روز تا پایان فصل
          </span>
          <span className="rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-sm font-bold text-gold-400">
            🏆 {league}
          </span>
        </div>
      </header>

      <div className="px-5 mt-5 space-y-2">
        <Zone label="منطقهٔ صعود ⬆" color="#5ee08a" />
        {rows.map((r, i) => (
          <div key={r.rank}>
            <div
              className={`flex items-center gap-3 rounded-2xl p-3 ${
                r.you ? "bg-team-you/20 ring-2 ring-team-you/60" : "glass"
              }`}
            >
              <span className="w-7 text-center text-lg font-extrabold text-white/70">
                {MEDALS[r.rank] ?? faNum(r.rank)}
              </span>
              <Avatar label={r.short} color={r.color} size={44} crown={r.rank === 1} />
              <p className="flex-1 text-right font-bold">
                {r.name}
                {r.you && <span className="text-gold-400"> (تو)</span>}
              </p>
              <span className="font-extrabold text-gold-400">
                {faCount(r.points)}
                <span className="mr-1 text-xs text-white/50">XP</span>
              </span>
            </div>
            {i === 2 && <Zone label="منطقهٔ امن" color="rgba(255,255,255,0.35)" />}
            {i === 7 && <Zone label="منطقهٔ سقوط ⬇" color="#e5473f" />}
          </div>
        ))}
      </div>
    </div>
  );
}
