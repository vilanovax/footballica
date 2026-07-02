"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/store";
import { clubNextAction, unitIncomeSnapshot } from "@/lib/clubEconomy";
import { isBank } from "@/lib/vault";
import { faMoney, faNum } from "@/lib/format";

export function ClubHomeBanner({ onOpenClub }: { onOpenClub: () => void }) {
  const units = useGame((s) => s.units);
  const itemLevels = useGame((s) => s.itemLevels);
  const assign = useGame((s) => s.assign);
  const xp = useGame((s) => s.xp);
  const fans = useGame((s) => s.fans);
  const vaultLevel = useGame((s) => s.vaultLevel);
  const vaultBalance = useGame((s) => s.vaultBalance);

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const bank = isBank(vaultLevel);
  const snap = unitIncomeSnapshot({
    units,
    itemLevels,
    assign,
    xp,
    fans,
    vaultLevel,
    vaultBalance,
    now: now ?? undefined,
  });

  const action = clubNextAction({
    totalPending: snap.totalPending,
    vaultBalance,
    vaultFull: snap.vaultFull,
    vaultFree: snap.vaultFree,
    readyCount: snap.readyCount,
    isBank: bank,
  });

  const needsAttention =
    snap.totalPending > 0 || vaultBalance > 0 || snap.vaultFull;

  return (
    <button
      onClick={onOpenClub}
      className={`home-club-banner mx-5 mt-4 w-[calc(100%-2.5rem)] rounded-2xl p-4 text-right active:scale-[0.98] transition-transform ${
        needsAttention ? "home-club-banner--active" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{action.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-white/45 shrink-0">باشگاه ›</span>
            <p className="font-extrabold text-white truncate">{action.title}</p>
          </div>
          <p className="mt-1 text-xs text-white/60 leading-5">{action.detail}</p>
          <div className="mt-2.5 flex flex-wrap justify-end gap-2">
            {!bank && (
              <span className="home-club-stat-pill">
                🔐 {faMoney(vaultBalance)} / {faMoney(snap.vaultCap)}
              </span>
            )}
            {snap.readyCount > 0 && (
              <span className="home-club-stat-pill home-club-stat-pill--accent">
                🏪 {faNum(snap.readyCount)} واحد آماده
              </span>
            )}
            {bank && vaultBalance > 0 && (
              <span className="home-club-stat-pill home-club-stat-pill--accent">
                🏦 {faMoney(vaultBalance)} در بانک
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
