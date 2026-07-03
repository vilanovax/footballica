"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ClubFlowBar } from "@/components/ui/ClubFlowBar";
import { ClubCollectBar } from "@/components/ui/ClubCollectBar";
import { ClubBankSheet } from "@/components/ui/ClubBankSheet";
import { UnitCard, LockedUnitRow } from "@/components/ui/UnitCard";
import { UNITS } from "@/lib/units";
import { CLUB } from "@/lib/club";
import { fanIncomeMultiplier } from "@/lib/economy";
import {
  clubNextAction,
  isUnitUnlocked,
  unitIncomeSnapshot,
} from "@/lib/clubEconomy";
import { levelInfo, leagueForXp } from "@/lib/player";
import { vaultCapacity, isBank } from "@/lib/vault";
import { useGame } from "@/lib/store";
import { faNum, faShort, faCount, faClubMoney, faVaultM } from "@/lib/format";

interface ClubProps {
  onBack: () => void;
}

function PromotionBar() {
  const fans = useGame((s) => s.fans);
  const { promotion } = CLUB;
  const pct = Math.min(100, (fans / promotion.need) * 100);
  const remaining = Math.max(0, promotion.need - fans);

  return (
    <div className="mx-5 mt-6 rounded-2xl bg-black/20 px-4 py-3 border border-white/5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-gold-400">
          {faCount(fans)} / {faShort(promotion.need)} 🎽
        </span>
        <p className="text-xs font-extrabold text-white/70">
          🏆 صعود → {promotion.target}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full rounded-full bg-grass-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      {remaining > 0 && (
        <p className="mt-1.5 text-[10px] text-white/40 text-right">
          {faCount(remaining)} هوادار · هر برد دوئل ~۱۰۰
        </p>
      )}
    </div>
  );
}

export function Club({ onBack }: ClubProps) {
  const [now, setNow] = useState(() => Date.now());
  const [bankOpen, setBankOpen] = useState(false);

  const cards = useGame((s) => s.cards);
  const fans = useGame((s) => s.fans);
  const budget = useGame((s) => s.budget);
  const vaultBalance = useGame((s) => s.vaultBalance);
  const vaultLevel = useGame((s) => s.vaultLevel);
  const units = useGame((s) => s.units);
  const itemLevels = useGame((s) => s.itemLevels);
  const assign = useGame((s) => s.assign);
  const xp = useGame((s) => s.xp);
  const showVaultTutorial = useGame((s) => s.showVaultTutorial);
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

  const bank = isBank(vaultLevel);
  const { level } = levelInfo(xp);
  const league = leagueForXp(xp);
  const fanMult = fanIncomeMultiplier(fans);

  const next = clubNextAction({
    totalPending: snap.totalPending,
    vaultBalance,
    vaultFull: snap.vaultFull,
    vaultFree: snap.vaultFree,
    readyCount: snap.readyCount,
    isBank: bank,
  });

  const budgetFmt = faClubMoney(budget);
  const vaultCap = vaultCapacity(vaultLevel);
  const unlockedUnits = UNITS.filter((u) => isUnitUnlocked(u.id, xp));
  const lockedUnits = UNITS.filter((u) => !isUnitUnlocked(u.id, xp));

  return (
    <div className="pitch-stripes min-h-dvh pb-12">
      {/* هدر */}
      <header className="flex items-center gap-3 px-5 pt-6 pb-2">
        <button
          onClick={onBack}
          className="glass grid h-10 w-10 place-items-center rounded-2xl text-xl font-bold active:scale-95 transition"
          aria-label="بازگشت"
        >
          ‹
        </button>
        <div className="flex-1 min-w-0 text-right">
          <h1 className="text-lg font-extrabold leading-tight truncate">
            {club.name}
          </h1>
          <p className="text-[11px] font-bold text-gold-400/90">
            ⭐ {faNum(level)} · {league}
          </p>
        </div>
        <Avatar label={club.crest} color={club.color} size={48} />
      </header>

      {/* پنل اقتصاد */}
      <div className="club-economy-panel mx-5 mt-2">
        <div className="flex items-end justify-between gap-3">
          <div className="flex gap-2 shrink-0">
            <div className="club-stat-chip">
              <span className="text-sm font-extrabold">{faShort(fans)}</span>
              <span className="text-[10px] text-white/45">🎽</span>
            </div>
            <div className="club-stat-chip">
              <span className="text-sm font-extrabold">{faNum(cards)}</span>
              <span className="text-[10px] text-white/45">⚡</span>
            </div>
            {fanMult > 1 && (
              <div className="club-stat-chip text-grass-400">
                <span className="text-xs font-extrabold">
                  ×{fanMult.toFixed(2).replace(".", "٫")}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setBankOpen(true)}
            className="club-budget-btn text-right min-w-0 flex-1 active:scale-[0.98] transition-transform"
          >
            <p className="text-[10px] text-white/45">بودجهٔ قابلِ خرج</p>
            <p className="text-2xl font-extrabold text-gold-400 leading-tight">
              {budgetFmt.value}
              <span className="text-base text-gold-400/85 mr-1">
                {budgetFmt.unit}
              </span>
              <span className="text-xs text-white/45">تومان</span>
            </p>
            {!bank && (
              <p className="mt-1 text-[11px] font-bold text-white/50">
                گاوصندوق{" "}
                <span className="text-white/70 tabular-nums">
                  {faVaultM(vaultBalance)} / {faVaultM(vaultCap)}
                </span>
              </p>
            )}
            {bank && (
              <p className="mt-1 text-[11px] font-bold text-grass-400">
                🏦 بانکِ اسپانسر فعال
              </p>
            )}
          </button>
          <button
            type="button"
            onClick={() => setBankOpen(true)}
            className="club-bank-icon-btn shrink-0"
            aria-label="جزئیات خزانه"
          >
            {bank ? "🏦" : "🔐"}
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-white/8">
          <p className="mb-2 text-center text-[10px] font-bold text-white/40">
            مسیر پول
          </p>
          <ClubFlowBar
            unitsPending={snap.totalPending}
            vaultBalance={vaultBalance}
            budget={budget}
            vaultCap={vaultCap}
            vaultFull={snap.vaultFull}
            activeStep={next.step}
            onOpenBank={() => setBankOpen(true)}
          />
        </div>

        <div className="club-next-action mt-3 flex items-center gap-2.5 rounded-xl px-3 py-2.5">
          <span className="text-xl shrink-0">{next.emoji}</span>
          <div className="flex-1 text-right min-w-0">
            <p className="text-xs font-extrabold text-gold-400">{next.title}</p>
            <p className="text-[11px] text-white/55 leading-5 truncate">
              {next.detail}
            </p>
          </div>
          {showVaultTutorial && vaultBalance > 0 && next.step === "vault" && (
            <button
              type="button"
              onClick={() => setBankOpen(true)}
              className="shrink-0 rounded-lg bg-gold-400 px-2.5 py-1 text-[10px] font-extrabold text-[#3a2600]"
            >
              برداشت
            </button>
          )}
        </div>
      </div>

      <ClubBankSheet
        open={bankOpen}
        onClose={() => setBankOpen(false)}
        unitsPending={snap.totalPending}
      />

      <ClubCollectBar onOpenBank={() => setBankOpen(true)} />

      {/* واحدهای فعال */}
      <div className="mt-6">
        <div className="px-5 flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-white/35">مرحله ۱</span>
          <h2 className="text-base font-extrabold">
            واحدهای درآمد
            <span className="mr-2 text-xs font-bold text-grass-400">
              {faNum(unlockedUnits.length)} فعال
            </span>
          </h2>
        </div>
        <div className="space-y-3">
          {unlockedUnits.map((u) => (
            <UnitCard key={u.id} id={u.id} />
          ))}
        </div>
      </div>

      {/* واحدهای قفل */}
      {lockedUnits.length > 0 && (
        <div className="mx-5 mt-6 rounded-2xl bg-black/20 px-4 py-3 border border-white/5">
          <p className="text-sm font-extrabold text-white/55 text-right mb-2">
            🔒 باز شدن با level-up
          </p>
          {lockedUnits.map((u) => (
            <LockedUnitRow key={u.id} id={u.id} />
          ))}
        </div>
      )}

      <PromotionBar />
    </div>
  );
}
