"use client";

import { Avatar } from "@/components/ui/Avatar";
import { faNum, faCount } from "@/lib/format";
import { PLAYER } from "@/lib/types";

interface Row {
  rank: number;
  name: string;
  short: string;
  points: number;
  color: string;
  you?: boolean;
}

const ROWS: Row[] = [
  { rank: 1, name: "سینا کریمی", short: "س.ک", points: 4820, color: "foe" },
  { rank: 2, name: "زهرا رضایی", short: "ز.ر", points: 4510, color: "#8b3fe0" },
  { rank: 3, name: "مهدی احمدی", short: "م.ا", points: 4180, color: "#e08a2f" },
  { rank: 4, name: PLAYER.name, short: "تو", points: 3960, color: "you", you: true },
  { rank: 5, name: "علی نوری", short: "ع.ن", points: 3720, color: "foe" },
  { rank: 6, name: "نگار صادقی", short: "ن.ص", points: 3400, color: "#2f9e5f" },
  { rank: 7, name: "رضا حریف", short: "ر.ح", points: 3120, color: "foe" },
  { rank: 8, name: "سارا محمدی", short: "س.م", points: 2890, color: "#8b3fe0" },
  { rank: 9, name: "کیان رستمی", short: "ک.ر", points: 2610, color: "#2f9e5f" },
  { rank: 10, name: "لیلا کاظمی", short: "ل.ک", points: 2350, color: "foe" },
];

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
  return (
    <div className="pitch-stripes min-h-dvh pb-32">
      <header className="px-5 pt-6 text-right">
        <h1 className="text-2xl font-extrabold">رده‌بندی هفتگی</h1>
        <div className="mt-2 flex items-center justify-between">
          <span className="rounded-lg bg-white/10 px-3 py-1 text-sm font-bold text-white/70">
            ⏳ ۳ روز تا پایان فصل
          </span>
          <span className="rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-sm font-bold text-gold-400">
            🏆 {PLAYER.league}
          </span>
        </div>
      </header>

      <div className="px-5 mt-5 space-y-2">
        <Zone label="منطقهٔ صعود ⬆" color="#5ee08a" />
        {ROWS.map((r, i) => (
          <div key={r.rank}>
            <div
              className={`flex items-center gap-3 rounded-2xl p-3 ${
                r.you
                  ? "bg-team-you/20 ring-2 ring-team-you/60"
                  : "glass"
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
                <span className="mr-1 text-xs text-white/50">امتیاز</span>
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
