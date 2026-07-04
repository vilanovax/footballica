"use client";

import { useState } from "react";
import { useGame } from "@/lib/store";
import {
  faClubMoneyLabel,
  faNum,
  faVaultM,
  faClubMoney,
} from "@/lib/format";
import {
  vaultInfo,
  vaultCapacity,
  vaultUpgradeCost,
  isBank,
  VAULT_MAX,
} from "@/lib/vault";
import { ECONOMY } from "@/lib/economy";

interface ClubBankSheetProps {
  open: boolean;
  onClose: () => void;
  unitsPending?: number;
}

function LedgerRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`bank-ledger-row ${accent ? "bank-ledger-row--accent" : ""}`}>
      <span className="bank-ledger-row__value">{value}</span>
      <span className="bank-ledger-row__label">{label}</span>
    </div>
  );
}

export function ClubBankSheet({
  open,
  onClose,
  unitsPending = 0,
}: ClubBankSheetProps) {
  const budget = useGame((s) => s.budget);
  const vaultLevel = useGame((s) => s.vaultLevel);
  const upgradeVault = useGame((s) => s.upgradeVault);

  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);

  if (!open) return null;

  const bank = isBank(vaultLevel);
  const info = vaultInfo(vaultLevel);
  const cap = vaultCapacity(vaultLevel);
  const pct = bank ? 0 : Math.min(100, cap > 0 ? (budget / cap) * 100 : 0);
  const full = !bank && budget >= cap;
  const cost = vaultUpgradeCost(vaultLevel);
  const isFinal = vaultLevel >= VAULT_MAX;
  const nextIsBank = vaultLevel === VAULT_MAX - 1;
  const canUpgrade = !isFinal && budget >= cost;
  const budgetFmt = faClubMoney(budget);

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
    <div className="bank-sheet-root" role="dialog" aria-modal="true" aria-label="خزانه باشگاه">
      <button
        type="button"
        className="bank-sheet-backdrop"
        onClick={onClose}
        aria-label="بستن"
      />
      <div className={`bank-sheet ${flash ? "flash-green" : ""}`}>
        <div className="bank-sheet__handle" aria-hidden />
        <div className="bank-sheet__head">
          <button type="button" onClick={onClose} className="bank-sheet__close" aria-label="بستن">
            ✕
          </button>
          <div className="text-right flex-1">
            <h2 className="bank-sheet__title">خزانهٔ باشگاه</h2>
            <p className="bank-sheet__sub">پول قابلِ خرج · ارتقای خزانه</p>
          </div>
          <span className="bank-sheet__icon" aria-hidden>
            {bank ? "🏦" : "🔐"}
          </span>
        </div>

        <div className="bank-sheet__hero">
          <p className="bank-sheet__hero-label">موجودیٔ خزانه</p>
          <p className="bank-sheet__hero-value">
            {budgetFmt.value}
            <span className="bank-sheet__hero-unit"> {budgetFmt.unit}</span>
          </p>
          <p className="bank-sheet__hero-unit-full">تومان</p>
        </div>

        <div className="bank-ledger">
          <p className="bank-ledger__title">گزارش خلاصه</p>
          <LedgerRow label="خزانه" value={faClubMoneyLabel(budget)} accent />
          {!bank && (
            <LedgerRow
              label="ظرفیت خزانه"
              value={`${faVaultM(budget)} / ${faVaultM(cap)} میلیون`}
            />
          )}
          {unitsPending > 0 && (
            <LedgerRow
              label="در واحدها (واریز نشده)"
              value={faClubMoneyLabel(unitsPending)}
            />
          )}
          <LedgerRow
            label={`سطح خزانه — ${info.name}`}
            value={`سطح ${faNum(vaultLevel)}`}
          />
        </div>

        {!bank && (
          <div className="bank-vault-panel">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span
                className={
                  full
                    ? "text-gold-400 font-bold text-xs"
                    : budget > 0
                      ? "text-grass-400 font-bold text-xs"
                      : "text-white/45 text-xs"
                }
              >
                {full ? "پر — خرج کن یا ارتقا بده" : budget > 0 ? "آمادهٔ خرج" : "خالی"}
              </span>
              <span className="text-sm font-extrabold">
                {faVaultM(budget)}
                <span className="text-white/35"> / {faVaultM(cap)}</span>
              </span>
            </div>
            <div className="bank-vault-panel__track">
              <div
                className="bank-vault-panel__fill"
                style={{
                  width: `${pct}%`,
                  background: full
                    ? "linear-gradient(90deg,#e0a92e,#f5c542)"
                    : budget > 0
                      ? "linear-gradient(90deg,#2f9e5f,#5ee08a)"
                      : "rgba(255,255,255,0.08)",
                }}
              />
            </div>
            <p className="mt-2 text-[10px] text-white/38 text-center">
              آفلاین حداکثر {faNum(ECONOMY.offlineCapHours)} ساعت
            </p>
          </div>
        )}

        {bank && (
          <div className="bank-bank-banner">
            <p className="font-extrabold text-gold-400 text-sm">✓ بانکِ اسپانسر فعال</p>
            <p className="mt-1 text-xs text-white/55 leading-5">
              درآمد بدون سقف ظرفیت — مستقیم به خزانه می‌رود
            </p>
          </div>
        )}

        <div className="bank-sheet__actions">
          <button
            type="button"
            onClick={upgrade}
            className={`w-full rounded-2xl py-3.5 text-sm font-extrabold transition active:scale-[0.98] ${shake ? "animate-shake" : ""} ${
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
              ? "حداکثر ظرفیت ✓"
              : nextIsBank
                ? `🏦 تبدیل به بانک · ${faClubMoneyLabel(cost)}`
                : canUpgrade
                  ? `ارتقای خزانه · ${faClubMoneyLabel(cost)}`
                  : `ارتقا نیاز ${faClubMoneyLabel(cost)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
