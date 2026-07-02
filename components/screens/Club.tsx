"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ClubVault } from "@/components/ui/ClubVault";
import { UnitCard } from "@/components/ui/UnitCard";
import { ClubFlowBar } from "@/components/ui/ClubFlowBar";
import { ClubCollectBar } from "@/components/ui/ClubCollectBar";
import { UNITS } from "@/lib/units";
import { CLUB, UPGRADES, costFor, MAX_LEVEL, type Upgrade } from "@/lib/club";
import { unitIncomeSnapshot } from "@/lib/clubEconomy";
import { useGame } from "@/lib/store";
import { faNum, faShort, faCount, faMoney } from "@/lib/format";

interface ClubProps {
  onBack: () => void;
}

type ClubTab = "income" | "growth";

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
      {remaining > 0 && (
        <p className="mt-1.5 text-right text-[11px] text-white/50">
          {faCount(remaining)} هوادار دیگر · هر بردِ دوئل ~۱۲۰
        </p>
      )}
    </div>
  );
}

function UpgradeRow({ u }: { u: Upgrade }) {
  const level = useGame((s) => s.levels[u.id]);
  const coins = useGame((s) => s.coins);
  const tryUpgrade = useGame((s) => s.tryUpgrade);

  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);
  const [floatCost, setFloatCost] = useState<number | null>(null);

  const locked = Boolean(u.lockedUntil);
  const maxed = level >= MAX_LEVEL;
  const cost = costFor(u.baseCost, level);
  const affordable = coins >= cost;
  const progress = (level / MAX_LEVEL) * 100;

  function onBuy() {
    const res = tryUpgrade(u.id);
    if (res === "ok") {
      setFloatCost(cost);
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
      setTimeout(() => setFloatCost(null), 800);
    } else if (res === "poor") {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  return (
    <div
      className={`rounded-3xl p-3.5 flex items-center gap-3 transition ${
        locked ? "opacity-75" : ""
      } ${flash ? "flash-green" : ""}`}
      style={{ background: "linear-gradient(150deg,#14301f,#0f2018)" }}
    >
      <div
        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl"
        style={{ background: "linear-gradient(160deg,#2f9e5f,#17683b)" }}
      >
        {u.emoji}
      </div>
      <div className="flex-1 text-right min-w-0">
        <div className="flex items-center justify-end gap-2">
          <span
            key={level}
            className={`rounded-md bg-gold-500/15 px-2 py-0.5 text-xs font-bold text-gold-400 ${
              flash ? "badge-pop inline-block" : ""
            }`}
          >
            سطح {faNum(level)}
          </span>
          <h4 className="font-extrabold truncate">{u.name}</h4>
        </div>
        <p className="mt-1 text-sm text-white/55 leading-6">{u.effect}</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/40">
          <div
            className="h-full rounded-full bg-gold-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {locked ? (
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-black/25 px-3 py-2 text-white/45 shrink-0">
          <span className="text-lg">🔒</span>
          <span className="text-xs font-bold">{u.lockedUntil}</span>
        </div>
      ) : maxed ? (
        <div className="shrink-0 rounded-2xl bg-grass-500/15 px-4 py-3 text-sm font-extrabold text-grass-400">
          حداکثر ✓
        </div>
      ) : (
        <div className="relative shrink-0">
          {floatCost !== null && (
            <span className="float-up pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 text-sm font-extrabold text-team-foe">
              −{faNum(floatCost)}
            </span>
          )}
          <button
            onClick={onBuy}
            className={`rounded-2xl px-3 py-3 text-sm font-extrabold min-w-[72px] ${
              affordable ? "btn-gold" : "bg-white/8 text-white/40"
            } ${shake ? "animate-shake" : ""}`}
          >
            {affordable ? (
              <>
                {faNum(cost)} 🪙
              </>
            ) : (
              <span className="text-[11px] leading-tight block">
                {faNum(cost)} 🪙
                <br />
                <span className="text-white/35">کم داری</span>
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export function Club({ onBack }: ClubProps) {
  const [tab, setTab] = useState<ClubTab>("income");
  const [now, setNow] = useState(() => Date.now());

  const coins = useGame((s) => s.coins);
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
    vaultLevel,
    vaultBalance,
    now,
  });

  return (
    <div className="pitch-stripes min-h-dvh pb-10">
      <div className="club-sticky-top">
        {/* هدر */}
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

        {/* کیفِ پول */}
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
            <StatPill value={faCount(coins)} label="سکه" icon="🪙" />
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

        <PromotionBar />

        {/* تب‌ها */}
        <div className="club-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "income"}
            data-active={tab === "income"}
            className="club-tab"
            onClick={() => setTab("income")}
          >
            💰 درآمد
          </button>
          <button
            role="tab"
            aria-selected={tab === "growth"}
            data-active={tab === "growth"}
            className="club-tab"
            onClick={() => setTab("growth")}
          >
            📈 رشد
          </button>
        </div>
      </div>

      {tab === "income" && (
        <>
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
        </>
      )}

      {tab === "growth" && (
        <>
          <div className="mx-5 mt-4 glass rounded-2xl p-4 text-right">
            <h3 className="font-extrabold">مسیرِ صعود</h3>
            <p className="mt-2 text-sm text-white/60 leading-7">
              با دوئل برد، هوادار جذب کن و به دستهٔ بالاتر صعود کن. ارتقاهای
              زیر با <b className="text-gold-400">سکه 🪙</b> خریده می‌شوند و
              در کوییز کمکت می‌کنند.
            </p>
          </div>

          <div className="px-5 mt-5 mb-2 flex items-center justify-between">
            <span className="rounded-lg bg-gold-500/15 px-2.5 py-1 text-xs font-bold text-gold-400">
              🪙 سکه
            </span>
            <h3 className="text-lg font-extrabold">ارتقای باشگاه</h3>
          </div>
          <div className="px-5 space-y-3 pb-4">
            {UPGRADES.map((u) => (
              <UpgradeRow key={u.id} u={u} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
