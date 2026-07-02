"use client";

import { useState } from "react";
import { useGame } from "@/lib/store";
import { unitIncomeSnapshot } from "@/lib/clubEconomy";
import { isBank } from "@/lib/vault";
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

  const bank = isBank(vaultLevel);
  const canCollect =
    snap.readyCount > 0 && snap.vaultFree > 0 && !bank && snap.totalPending > 0;
  const blocked = snap.vaultFree <= 0 && snap.totalPending > 0 && !bank;

  if (snap.readyCount === 0 && snap.fullCount === 0 && !blocked) return null;

  function collectAll() {
    const got = collectAllUnits();
    if (got > 0) {
      setFloatAmt(got);
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
      setTimeout(() => setFloatAmt(null), 900);
    }
  }

  if (blocked) {
    return (
      <div className="mx-5 mt-4 rounded-2xl border border-team-foe/40 bg-team-foe/10 px-4 py-3 text-right">
        <p className="text-sm font-extrabold text-team-foe">
          ⚠️ واحدها منتظرند — گاوصندوق پر است
        </p>
        <p className="mt-1 text-xs text-white/60 leading-5">
          {faMoney(snap.totalPending)} در واحدها جمع شده. اول گاوصندوق را
          برداشت یا ارتقا بده.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`mx-5 mt-4 rounded-2xl px-4 py-3 ${
        flash
          ? "bg-grass-500/20 ring-1 ring-grass-400/40"
          : canCollect
            ? "club-collect-ready"
            : "border border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 text-right min-w-0">
          <p className="text-sm font-extrabold text-white/90">
            {snap.fullCount > 0
              ? `🔥 ${faNum(snap.fullCount)} واحد پر شده`
              : `${faNum(snap.readyCount)} واحد آمادهٔ واریز`}
          </p>
          <p className="mt-0.5 text-xs text-white/55">
            {canCollect
              ? `${faMoney(snap.totalPending)} → گاوصندوق`
              : "در حال جمع شدن…"}
          </p>
        </div>
        <div className="relative shrink-0">
          {floatAmt !== null && (
            <span className="float-up pointer-events-none absolute -top-4 left-1/2 text-xs font-extrabold text-gold-400">
              +{faMoney(floatAmt)}
            </span>
          )}
          <button
            onClick={collectAll}
            disabled={!canCollect}
            className={`rounded-xl px-5 py-2.5 text-sm font-extrabold transition active:scale-[0.97] ${
              canCollect ? "btn-gold shadow-lg" : "bg-white/8 text-white/35"
            }`}
          >
            واریزِ همه
          </button>
        </div>
      </div>
    </div>
  );
}
