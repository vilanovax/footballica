"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ClubVault } from "@/components/ui/ClubVault";
import { UnitCard } from "@/components/ui/UnitCard";
import { ClubFlowBar } from "@/components/ui/ClubFlowBar";
import { ClubCollectBar } from "@/components/ui/ClubCollectBar";
import { UNITS } from "@/lib/units";
import { CLUB } from "@/lib/club";
import { fanIncomeMultiplier } from "@/lib/economy";
import { unitIncomeSnapshot } from "@/lib/clubEconomy";
import { useGame } from "@/lib/store";
import { faNum, faShort, faCount } from "@/lib/format";

interface ClubProps {
  onBack: () => void;
}

function StatPill({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: string;
}) {
  return (
    <div className="glass rounded-2xl py-2.5 text-center">
      <p className="text-base font-extrabold leading-none">
        {value} <span className="text-sm">{icon}</span>
      </p>
      <p className="mt-1 text-[10px] text-white/55">{label}</p>
    </div>
  );
}

function PromotionBar() {
  const fans = useGame((s) => s.fans);
  const { promotion } = CLUB;
  const pct = Math.min(100, (fans / promotion.need) * 100);
  const remaining = Math.max(0, promotion.need - fans);
  const fanMult = fanIncomeMultiplier(fans);

  return (
    <div className="mx-5 mt-3 glass rounded-2xl px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-gold-400 shrink-0">
          {faCount(fans)} / {faShort(promotion.need)}
        </span>
        <p className="text-xs font-extrabold truncate">
          🏆 صعود به {promotion.target}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg,#2f9e5f,#5ee08a)",
          }}
        />
      </div>
      <p className="mt-1.5 text-right text-[11px] text-white/50">
        {remaining > 0
          ? `${faCount(remaining)} هوادار دیگر · هر بردِ دوئل ~۱۰۰`
          : `ضریبِ درآمدِ تجاری: ×${fanMult.toFixed(2).replace(".", "٫")}`}
      </p>
    </div>
  );
}

export function Club({ onBack }: ClubProps) {
  const [now, setNow] = useState(() => Date.now());

  const cards = useGame((s) => s.cards);
  const fans = useGame((s) => s.fans);
  const budget = useGame((s) => s.budget);
  const vaultBalance = useGame((s) => s.vaultBalance);
  const vaultLevel = useGame((s) => s.vaultLevel);
  const units = useGame((s) => s.units);
  const itemLevels = useGame((s) => s.itemLevels);
  const assign = useGame((s) => s.assign);
  const xp = useGame((s) => s.xp);
  const club = useGame((s) => s.club);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(t);
  }, []);

  const snap = unitIncomeSnapshot({
    units,
    itemLevels,
    assign,
    xp,
    fans,
    vaultLevel,
    vaultBalance,
    now,
  });

  return (
    <div className="pitch-stripes min-h-dvh pb-10">
      <div className="club-sticky-top">
        <header className="flex items-center gap-3 px-5 pt-6">
          <button
            onClick={onBack}
            className="glass grid h-10 w-10 place-items-center rounded-2xl text-xl font-bold"
            aria-label="بازگشت"
          >
            ‹
          </button>
          <div className="flex-1 min-w-0 text-right">
            <h1 className="text-xl font-extrabold leading-tight truncate">
              {club.name}
            </h1>
            <span className="mt-0.5 inline-block rounded-lg border border-gold-500/40 bg-gold-500/10 px-2.5 py-0.5 text-xs font-bold text-gold-400">
              🏆 {CLUB.division} · رتبهٔ {faNum(CLUB.rank)}
            </span>
          </div>
          <div className="relative shrink-0">
            <Avatar label={club.crest} color={club.color} size={52} />
            <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-gold-400 text-[10px] font-extrabold text-[#3a2600] ring-2 ring-pitch-900">
              {faNum(CLUB.badgeLevel)}
            </span>
          </div>
        </header>

        <div
          className="mx-5 mt-4 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
          style={{ background: "linear-gradient(105deg,#1a3d28,#0f2018)" }}
        >
          <div className="min-w-0">
            <p className="text-[10px] text-white/50">موجودیِ قابلِ خرج</p>
            <p className="text-xl font-extrabold text-gold-400 truncate">
              {faCount(budget)}{" "}
              <span className="text-xs text-white/55">تومان</span>
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <StatPill value={faShort(fans)} label="هوادار" icon="🎽" />
            <StatPill value={faNum(cards)} label="کارت" icon="⚡" />
          </div>
        </div>

        <ClubFlowBar
          unitsPending={snap.totalPending}
          vaultBalance={vaultBalance}
          budget={budget}
          vaultFull={snap.vaultFull}
        />

        {snap.vaultFull && (
          <p className="mx-5 mt-2 text-center text-xs font-bold text-gold-400 leading-5">
            گاوصندوق پر شده؛ برای ادامه درآمدزایی آن را برداشت یا ارتقا بده.
          </p>
        )}

        <PromotionBar />
      </div>

      <ClubCollectBar />

      <div className="mt-4">
        <ClubVault />
      </div>

      <h3 className="px-5 mt-5 mb-2 text-lg font-extrabold text-right">
        واحدهای درآمدزا
        <span className="mr-2 text-xs font-bold text-white/40">💰 بودجه</span>
      </h3>
      <div className="space-y-3 pb-4">
        {UNITS.map((u) => (
          <UnitCard key={u.id} id={u.id} />
        ))}
      </div>
    </div>
  );
}
