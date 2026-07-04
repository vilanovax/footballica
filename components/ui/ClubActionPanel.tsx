"use client";

import { useState } from "react";
import { useGame } from "@/lib/store";
import { unitIncomeSnapshot } from "@/lib/clubEconomy";
import { isBank, vaultUpgradeCost, VAULT_MAX } from "@/lib/vault";
import { faClubMoneyLabel, faNum } from "@/lib/format";

interface ClubActionPanelProps {
  snap: ReturnType<typeof unitIncomeSnapshot>;
  onOpenBank: () => void;
  unlockedUnitCount: number;
}

export function ClubActionPanel({
  snap,
  onOpenBank,
  unlockedUnitCount,
}: ClubActionPanelProps) {
  const vaultLevel = useGame((s) => s.vaultLevel);
  const budget = useGame((s) => s.budget);
  const collectAllUnits = useGame((s) => s.collectAllUnits);
  const upgradeVault = useGame((s) => s.upgradeVault);

  const [flash, setFlash] = useState(false);
  const [floatAmt, setFloatAmt] = useState<number | null>(null);
  const [shake, setShake] = useState(false);

  const bank = isBank(vaultLevel);
  const safeBudget = Number.isFinite(budget) ? budget : 0;
  const canCollect =
    snap.readyCount > 0 && snap.vaultFree > 0 && !bank && snap.totalPending > 0;
  const blocked = snap.vaultFree <= 0 && snap.totalPending > 0 && !bank;
  const vaultFull = snap.vaultFull && !bank;

  const upgradeCost = vaultUpgradeCost(vaultLevel);
  const canUpgradeVault =
    vaultLevel < VAULT_MAX && safeBudget >= upgradeCost;

  if (!canCollect && !blocked && !vaultFull && snap.readyCount === 0) {
    return null;
  }

  function collectAll() {
    const got = collectAllUnits();
    if (got > 0) {
      setFloatAmt(got);
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
      setTimeout(() => setFloatAmt(null), 900);
    }
  }

  function tryUpgradeVault() {
    if (upgradeVault() === "ok") {
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      onOpenBank();
    }
  }

  if (canCollect) {
    return (
      <div
        className={`club-action-panel mx-5 mt-3 rounded-2xl px-4 py-3 ${
          flash ? "club-action-panel--flash" : "club-action-panel--collect"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {floatAmt !== null && (
              <span className="float-up pointer-events-none absolute -top-4 left-1/2 text-xs font-extrabold text-gold-400 whitespace-nowrap">
                +{faClubMoneyLabel(floatAmt)}
              </span>
            )}
            <button
              type="button"
              onClick={collectAll}
              className="club-action-btn club-action-btn--gold rounded-xl px-4 py-2.5 text-sm font-extrabold active:scale-[0.97]"
            >
              جمع‌آوری
            </button>
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="text-sm font-extrabold text-white">
              🏪 درآمد آماده در واحدها
            </p>
            <p className="mt-0.5 text-xs text-white/60">
              {faClubMoneyLabel(snap.totalPending)} → خزانه
              {unlockedUnitCount === 1 && " · از کارت واحد هم می‌توانی"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (blocked || vaultFull) {
    return (
      <div className="club-action-panel club-action-panel--blocked mx-5 mt-3 rounded-2xl px-4 py-3.5 text-right">
        <p className="text-sm font-extrabold text-team-foe">
          ⚠️ خزانه پر است
          {snap.totalPending > 0 && (
            <span className="text-white/70 font-bold">
              {" "}
              · {faClubMoneyLabel(snap.totalPending)} در واحدها
            </span>
          )}
        </p>
        <p className="mt-1 text-xs text-white/55 leading-5">
          خرج کن یا گاوصندوق را بزرگ‌تر کن تا درآمد جدید وارد شود.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={tryUpgradeVault}
            className={`club-action-btn flex-1 rounded-xl py-2.5 text-xs font-extrabold active:scale-[0.98] ${shake ? "animate-shake" : ""} ${
              canUpgradeVault
                ? "club-action-btn--gold"
                : "bg-white/8 text-white/40"
            }`}
          >
            {canUpgradeVault
              ? `ارتقای گاوصندوق · ${faClubMoneyLabel(upgradeCost)}`
              : `ارتقا · ${faClubMoneyLabel(upgradeCost)}`}
          </button>
          <button
            type="button"
            onClick={onOpenBank}
            className="flex-1 rounded-xl bg-white/8 py-2.5 text-xs font-extrabold text-white/75 active:scale-[0.98]"
          >
            جزئیات خزانه
          </button>
        </div>
      </div>
    );
  }

  return null;
}
