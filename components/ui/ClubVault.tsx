"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/store";
import { faNum, faMoney } from "@/lib/format";
import {
  vaultInfo,
  vaultCapacity,
  vaultUpgradeCost,
  isBank,
  VAULT_MAX,
} from "@/lib/vault";

export function ClubVault() {
  const budget = useGame((s) => s.budget);
  const vaultLevel = useGame((s) => s.vaultLevel);
  const vaultBalance = useGame((s) => s.vaultBalance);
  const withdrawVault = useGame((s) => s.withdrawVault);
  const upgradeVault = useGame((s) => s.upgradeVault);

  const [floatAmt, setFloatAmt] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);

  const bank = isBank(vaultLevel);

  // بانک: برداشتِ خودکار به بودجه
  useEffect(() => {
    if (!bank) return;
    const id = setInterval(() => withdrawVault(), 3000);
    return () => clearInterval(id);
  }, [bank, withdrawVault]);

  const info = vaultInfo(vaultLevel);
  const cap = vaultCapacity(vaultLevel);
  const pct = Math.min(100, (vaultBalance / cap) * 100);
  const full = vaultBalance >= cap;

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
      className={`mx-5 rounded-3xl p-4 ${flash ? "flash-green" : ""} ${
        bank ? "ring-1 ring-gold-500/50" : ""
      }`}
      style={{
        background: bank
          ? "linear-gradient(150deg,#3a2e0e,#14301f)"
          : "linear-gradient(150deg,#1a3d28,#0f2018)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-gold-500/15 px-2.5 py-1 text-xs font-bold text-gold-400">
          سطح {faNum(vaultLevel)}
        </span>
        <h3 className="text-lg font-extrabold">
          {info.name} {bank ? "🏦" : "🔐"}
        </h3>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className={full ? "font-bold text-gold-400" : "text-white/60"}>
          {full ? "پر شده — برداشت کن" : bank ? "برداشتِ خودکار فعال" : "انبارِ موقت"}
        </span>
        <span className="font-extrabold">
          {faMoney(vaultBalance)} / {faMoney(cap)}
        </span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-linear"
          style={{
            width: `${pct}%`,
            background: full
              ? "linear-gradient(90deg,#e0a92e,#f5c542)"
              : "linear-gradient(90deg,#2f9e5f,#5ee08a)",
          }}
        />
      </div>
      {full && !bank && (
        <p className="mt-2 text-center text-xs text-gold-400">
          گاوصندوق پر است — برداشت کن تا واحدها دوباره واریز کنند
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          {floatAmt !== null && (
            <span className="float-up pointer-events-none absolute -top-3 left-1/2 text-sm font-extrabold text-gold-400">
              +{faMoney(floatAmt)}
            </span>
          )}
          <button
            onClick={withdraw}
            disabled={vaultBalance <= 0}
            className={`w-full rounded-2xl py-3 text-sm font-extrabold transition ${
              vaultBalance > 0 ? "btn-gold" : "bg-white/8 text-white/35"
            } ${full && vaultBalance > 0 ? "animate-pulse-soft" : ""}`}
          >
            {vaultBalance > 0 ? "برداشت به بودجه" : "خالی است"}
          </button>
        </div>
        <button
          onClick={upgrade}
          className={`flex-1 rounded-2xl py-3 text-sm font-extrabold transition ${shake ? "animate-shake" : ""} ${
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

      {info.note && (
        <p className="mt-2 text-center text-xs text-white/40">{info.note}</p>
      )}
    </div>
  );
}
