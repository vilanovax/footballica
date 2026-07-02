"use client";

import { useState } from "react";
import { useGame } from "@/lib/store";
import { faNum, faMoney } from "@/lib/format";
import {
  vaultInfo,
  vaultCapacity,
  vaultUpgradeCost,
  isBank,
  VAULT_MAX,
} from "@/lib/vault";
import { ECONOMY } from "@/lib/economy";

interface ClubVaultProps {
  highlight?: boolean;
  unitsPending?: number;
}

export function ClubVault({
  highlight = false,
  unitsPending = 0,
}: ClubVaultProps) {
  const budget = useGame((s) => s.budget);
  const vaultLevel = useGame((s) => s.vaultLevel);
  const vaultBalance = useGame((s) => s.vaultBalance);
  const withdrawVault = useGame((s) => s.withdrawVault);
  const upgradeVault = useGame((s) => s.upgradeVault);

  const [floatAmt, setFloatAmt] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);

  const bank = isBank(vaultLevel);

  const info = vaultInfo(vaultLevel);
  const cap = vaultCapacity(vaultLevel);
  const pct = bank ? 0 : Math.min(100, cap > 0 ? (vaultBalance / cap) * 100 : 0);
  const full = !bank && vaultBalance >= cap;
  const emptyHint =
    vaultBalance <= 0 && unitsPending > 0 && !bank
      ? `${faMoney(unitsPending)} در واحدها — اول واریز کن`
      : null;

  const cost = vaultUpgradeCost(vaultLevel);
  const isFinal = vaultLevel >= VAULT_MAX;
  const nextIsBank = vaultLevel === VAULT_MAX - 1;
  const canUpgrade = !isFinal && budget >= cost;

  function withdraw() {
    const got = withdrawVault();
    if (got > 0) {
      setFloatAmt(got);
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
      setTimeout(() => setFloatAmt(null), 900);
    }
  }
  function upgrade() {
    if (upgradeVault() !== "ok") {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } else {
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
    }
  }

  return (
    <div
      className={`club-vault rounded-3xl p-4 ${flash ? "flash-green" : ""} ${
        bank
          ? "club-vault--bank"
          : highlight
            ? "ring-2 ring-gold-400 animate-pulse-soft"
            : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-lg bg-gold-500/15 px-2.5 py-1 text-xs font-bold text-gold-400 shrink-0">
          سطح {faNum(vaultLevel)}
        </span>
        <div className="text-right min-w-0">
          <h3 className="text-lg font-extrabold leading-tight">
            {info.name} {bank ? "🏦" : "🔐"}
          </h3>
          <p className="mt-0.5 text-[11px] text-white/45">
            {bank ? "مرحلهٔ ۲ — برداشت خودکار" : "مرحلهٔ ۲ — ذخیرهٔ موقت"}
          </p>
        </div>
      </div>

      {bank ? (
        <div className="mt-3 rounded-xl bg-gold-500/10 px-3 py-2.5 text-right">
          <p className="text-sm font-bold text-gold-400">
            ✓ برداشتِ خودکار فعال
          </p>
          <p className="mt-1 text-xs text-white/55 leading-5">
            درآمد واحدها و جایزهٔ مسابقه مستقیم به بودجه می‌رود.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between text-sm gap-2">
            <span
              className={
                full
                  ? "font-bold text-gold-400"
                  : vaultBalance > 0
                    ? "text-grass-400 font-bold"
                    : "text-white/50"
              }
            >
              {full
                ? "پر — برداشت کن"
                : vaultBalance > 0
                  ? "آمادهٔ برداشت"
                  : emptyHint ?? "خالی"}
            </span>
            <span className="font-extrabold shrink-0">
              {faMoney(vaultBalance)}{" "}
              <span className="text-white/35 font-bold">/ {faMoney(cap)}</span>
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-linear"
              style={{
                width: `${pct}%`,
                background: full
                  ? "linear-gradient(90deg,#e0a92e,#f5c542)"
                  : vaultBalance > 0
                    ? "linear-gradient(90deg,#2f9e5f,#5ee08a)"
                    : "rgba(255,255,255,0.08)",
              }}
            />
          </div>
        </>
      )}

      <div className="mt-3 flex gap-2">
        {!bank && (
          <div className="relative flex-1">
            {floatAmt !== null && (
              <span className="float-up pointer-events-none absolute -top-3 left-1/2 text-sm font-extrabold text-gold-400">
                +{faMoney(floatAmt)}
              </span>
            )}
            <button
              onClick={withdraw}
              disabled={vaultBalance <= 0}
              className={`w-full rounded-2xl py-3 text-sm font-extrabold transition active:scale-[0.98] ${
                vaultBalance > 0 ? "btn-gold" : "bg-white/8 text-white/35"
              } ${full && vaultBalance > 0 ? "animate-pulse-soft" : ""}`}
            >
              {vaultBalance > 0 ? "برداشت به بودجه" : "خالی است"}
            </button>
          </div>
        )}
        <button
          onClick={upgrade}
          className={`${bank ? "w-full" : "flex-1"} rounded-2xl py-3 text-sm font-extrabold transition active:scale-[0.98] ${shake ? "animate-shake" : ""} ${
            isFinal
              ? "bg-gold-500/15 text-gold-400"
              : canUpgrade
                ? nextIsBank
                  ? "bg-gold-400 text-[#3a2600]"
                  : "bg-team-you text-white"
                : "bg-white/8 text-white/35"
          }`}
        >
          {isFinal
            ? "بانکِ اسپانسر ✓"
            : nextIsBank
              ? `🏦 تبدیل · ${faMoney(cost)}`
              : canUpgrade
                ? `ظرفیت ↑ · ${faMoney(cost)}`
                : `نیاز ${faMoney(cost)}`}
        </button>
      </div>

      {!bank && (
        <p className="mt-2 text-center text-[10px] text-white/38">
          آفلاین حداکثر {faNum(ECONOMY.offlineCapHours)} ساعت · ظرفیت{" "}
          {faMoney(cap)}
        </p>
      )}
    </div>
  );
}
