"use client";

import { useState } from "react";
import { BottomSheet, BottomSheetHandle } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
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

  const bank = isBank(vaultLevel);
  const info = vaultInfo(vaultLevel);
  const cap = vaultCapacity(vaultLevel);
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
    <BottomSheet
      open={open}
      onClose={onClose}
      backdropClassName="bank-sheet-backdrop"
      panelClassName={`bank-sheet ${flash ? "flash-green" : ""}`}
    >
        <BottomSheetHandle className="bank-sheet__handle" />
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
            <ProgressBar
              value={budget}
              max={cap}
              tone={full ? "money" : "success"}
              className="bank-vault-panel__track"
              trackClassName="h-2"
              fillClassName={!full && budget <= 0 ? "bg-white/8" : undefined}
            />
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
          <Button
            onClick={upgrade}
            variant={
              isFinal ? "muted" : canUpgrade ? (nextIsBank ? "primary" : "accent") : "muted"
            }
            size="md"
            fullWidth
            shake={shake}
          >
            {isFinal
              ? "حداکثر ظرفیت ✓"
              : nextIsBank
                ? `🏦 تبدیل به بانک · ${faClubMoneyLabel(cost)}`
                : canUpgrade
                  ? `ارتقای خزانه · ${faClubMoneyLabel(cost)}`
                  : `ارتقا نیاز ${faClubMoneyLabel(cost)}`}
          </Button>
        </div>
    </BottomSheet>
  );
}
