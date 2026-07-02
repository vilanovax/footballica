"use client";

import { useState } from "react";
import { useGame } from "@/lib/store";
import { unitIncomeSnapshot } from "@/lib/clubEconomy";
import { faMoney, faNum } from "@/lib/format";

export function ClubCollectBar() {
  const units = useGame((s) => s.units);
  const itemLevels = useGame((s) => s.itemLevels);
  const assign = useGame((s) => s.assign);
  const xp = useGame((s) => s.xp);
  const fans = useGame((s) => s.fans);
  const vaultLevel = useGame((s) => s.vaultLevel);
  const vaultBalance = useGame((s) => s.vaultBalance);
  const collectAllUnits = useGame((s) => s.collectAllUnits);

  const [flash, setFlash] = useState(false);
  const [floatAmt, setFloatAmt] = useState<number | null>(null);

  const snap = unitIncomeSnapshot({
    units,
    itemLevels,
    assign,
    xp,
    fans,
    vaultLevel,
    vaultBalance,
  });

  if (snap.readyCount === 0 && snap.fullCount === 0) return null;

  function collectAll() {
    const got = collectAllUnits();
    if (got > 0) {
      setFloatAmt(got);
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
      setTimeout(() => setFloatAmt(null), 900);
    }
  }

  const label =
    snap.vaultFree <= 0
      ? "گاوصندوق پر شده؛ برای ادامه درآمدزایی آن را برداشت یا ارتقا بده."
      : snap.fullCount > 0
        ? `${faNum(snap.fullCount)} واحد پر شده`
        : `${faNum(snap.readyCount)} واحد آماده`;

  return (
    <div
      className={`mx-5 mt-3 flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${
        flash
          ? "border-grass-400/50 bg-grass-500/15"
          : snap.fullCount > 0
            ? "border-gold-500/40 bg-gold-500/10 animate-pulse-soft"
            : "border-white/10 bg-white/5"
      }`}
    >
      <span className="text-lg">⚡</span>
      <p className="flex-1 text-right text-sm font-bold text-white/80">{label}</p>
      <div className="relative shrink-0">
        {floatAmt !== null && (
          <span className="float-up pointer-events-none absolute -top-3 left-1/2 text-xs font-extrabold text-gold-400">
            +{faMoney(floatAmt)}
          </span>
        )}
        <button
          onClick={collectAll}
          disabled={snap.readyCount === 0 || snap.vaultFree <= 0}
          className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
            snap.readyCount > 0 && snap.vaultFree > 0
              ? "btn-gold"
              : "bg-white/8 text-white/35"
          }`}
        >
          واریزِ همه
        </button>
      </div>
    </div>
  );
}
