"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameCard } from "@/components/ui/GameCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useGame } from "@/lib/store";
import { unitIncomeSnapshot } from "@/lib/clubEconomy";
import { isBank } from "@/lib/vault";
import { faClubMoneyLabel, faNum, faVaultM } from "@/lib/format";

interface ClubHomeBannerProps {
  onOpenClub: () => void;
}

export function ClubHomeBanner({ onOpenClub }: ClubHomeBannerProps) {
  const units = useGame((s) => s.units);
  const itemLevels = useGame((s) => s.itemLevels);
  const assign = useGame((s) => s.assign);
  const xp = useGame((s) => s.xp);
  const fans = useGame((s) => s.fans);
  const vaultLevel = useGame((s) => s.vaultLevel);
  const budget = useGame((s) => s.budget);
  const collectAllUnits = useGame((s) => s.collectAllUnits);

  const [now, setNow] = useState(() => Date.now());
  const [flash, setFlash] = useState(false);
  const [collected, setCollected] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const bank = isBank(vaultLevel);
  const safeBudget = Number.isFinite(budget) ? budget : 0;
  const snap = unitIncomeSnapshot({
    units,
    itemLevels,
    assign,
    xp,
    fans,
    vaultLevel,
    budget: safeBudget,
    now,
  });

  const canCollect =
    snap.readyCount > 0 && snap.vaultFree > 0 && !bank && snap.totalPending > 0;
  const blocked = snap.vaultFree <= 0 && snap.totalPending > 0 && !bank;
  const needsAttention =
    canCollect || blocked || snap.vaultFull;

  function collect(e: React.MouseEvent) {
    e.stopPropagation();
    const got = collectAllUnits();
    if (got > 0) {
      setCollected(got);
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
      setTimeout(() => setCollected(null), 1200);
    }
  }

  return (
    <GameCard
      variant="asset"
      highlight={needsAttention}
      className={`home-club-panel mx-5 mt-3 rounded-2xl p-4 text-right ${
        needsAttention ? "home-club-panel--active" : ""
      } ${flash ? "home-club-panel--flash" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onOpenClub}
          className="text-xs font-bold text-white/45 shrink-0 pt-0.5 active:opacity-70"
        >
          باشگاه ›
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-white text-sm">خزانهٔ باشگاه</p>
          {!bank ? (
            <p className="mt-0.5 text-xs text-white/55 tabular-nums">
              🔐 {faVaultM(safeBudget)} / {faVaultM(snap.vaultCap)} میلیون
              <span className="text-white/35"> · پول آمادهٔ خرج</span>
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-grass-400">
              🏦 {faClubMoneyLabel(safeBudget)} · بدون سقف
            </p>
          )}
        </div>
      </div>

      {!bank && (
        <ProgressBar
          value={safeBudget}
          max={snap.vaultCap}
          tone={blocked || snap.vaultFull ? "money" : "success"}
          className="mt-3"
          trackClassName="h-1.5"
        />
      )}

      {snap.topReady && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2.5">
          <div className="flex-1 min-w-0 text-right">
            <p className="text-xs font-extrabold text-white/85">
              {snap.topReady.emoji} {snap.topReady.name}
              {snap.readyCount > 1 && (
                <span className="text-white/45 font-bold">
                  {" "}
                  +{faNum(snap.readyCount - 1)} واحد
                </span>
              )}
            </p>
            <p className="text-[11px] text-gold-400/90 mt-0.5">
              {faClubMoneyLabel(snap.topReady.pending)} آمادهٔ انتقال
            </p>
          </div>
          {canCollect ? (
            <Button
              onClick={collect}
              variant="primary"
              size="sm"
              className="home-club-collect-btn shrink-0 px-3"
            >
              {collected !== null
                ? `+${faClubMoneyLabel(collected)}`
                : "جمع‌آوری"}
            </Button>
          ) : blocked ? (
            <Button
              onClick={onOpenClub}
              variant="muted"
              size="sm"
              className="shrink-0 px-3 text-[10px] font-extrabold text-team-foe"
            >
              خزانه پر
            </Button>
          ) : null}
        </div>
      )}

      {!snap.topReady && (
        <Button
          onClick={onOpenClub}
          variant="muted"
          size="sm"
          fullWidth
          className="mt-3 text-xs font-bold text-white/50"
        >
          مدیریت باشگاه و ارتقاها
        </Button>
      )}
    </GameCard>
  );
}
