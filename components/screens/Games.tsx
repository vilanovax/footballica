"use client";

import { OngoingRow, ONGOING_GAMES } from "@/components/ui/OngoingRow";

interface GamesProps {
  onPlayQuick: () => void;
  onPlayBomb: () => void;
  onPlayDuel: () => void;
  onPlayPenalty: () => void;
  onPlaySurvival: () => void;
}

export function Games({
  onPlayQuick,
  onPlayBomb,
  onPlayDuel,
  onPlayPenalty,
  onPlaySurvival,
}: GamesProps) {
  return (
    <div className="pitch-stripes min-h-dvh pb-32">
      <header className="px-5 pt-6 text-right">
        <h1 className="text-2xl font-extrabold">بازی‌ها</h1>
      </header>

      {/* شروعِ سریع */}
      <div className="px-5 mt-5 grid grid-cols-3 gap-3">
        <button
          onClick={onPlayQuick}
          className="rounded-2xl p-3 text-center active:scale-95 transition"
          style={{ background: "linear-gradient(150deg,#2f9e5f,#17683b)" }}
        >
          <span className="text-3xl">⚡</span>
          <p className="mt-1 text-sm font-bold">بازی سریع</p>
        </button>
        <button
          onClick={onPlayBomb}
          className="rounded-2xl p-3 text-center active:scale-95 transition"
          style={{ background: "linear-gradient(150deg,#e5473f,#a51f18)" }}
        >
          <span className="text-3xl">💣</span>
          <p className="mt-1 text-sm font-bold">بمب</p>
        </button>
        <button
          onClick={onPlayDuel}
          className="rounded-2xl p-3 text-center active:scale-95 transition"
          style={{ background: "linear-gradient(150deg,#2f6fed,#1b45a8)" }}
        >
          <span className="text-3xl">⚔️</span>
          <p className="mt-1 text-sm font-bold">دوئل</p>
        </button>
        <button
          onClick={onPlayPenalty}
          className="rounded-2xl p-3 text-center active:scale-95 transition"
          style={{ background: "linear-gradient(150deg,#0f2018,#14301f)" }}
        >
          <span className="text-3xl">🥅</span>
          <p className="mt-1 text-sm font-bold">پنالتی</p>
        </button>
        <button
          onClick={onPlaySurvival}
          className="rounded-2xl p-3 text-center active:scale-95 transition"
          style={{ background: "linear-gradient(150deg,#3a1220,#5a1f2e)" }}
        >
          <span className="text-3xl">❤️</span>
          <p className="mt-1 text-sm font-bold">بقا</p>
        </button>
      </div>

      {/* در جریان */}
      <div className="px-5 mt-7 mb-3 flex items-center justify-between">
        <span className="rounded-full bg-gold-400 px-2 py-0.5 text-xs font-extrabold text-[#3a2600]">
          ۲ نوبتِ تو
        </span>
        <h3 className="text-xl font-extrabold">در جریان</h3>
      </div>
      <div className="px-5 space-y-2.5">
        {ONGOING_GAMES.map((g) => (
          <OngoingRow key={g.name} {...g} />
        ))}
      </div>
    </div>
  );
}
