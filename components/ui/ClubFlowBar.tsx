"use client";

import { faClubMoney, faVaultM } from "@/lib/format";
import type { ClubFlowStep } from "@/lib/clubEconomy";

interface ClubFlowBarProps {
  unitsPending: number;
  vaultBalance: number;
  budget: number;
  vaultCap: number;
  vaultFull?: boolean;
  activeStep: ClubFlowStep;
  onOpenBank?: () => void;
}

function flowValue(step: ClubFlowStep, amount: number, vaultCap: number): string {
  if (step === "vault") {
    return `${faVaultM(amount)}/${faVaultM(vaultCap)}`;
  }
  const { value } = faClubMoney(amount);
  return value;
}

export function ClubFlowBar({
  unitsPending,
  vaultBalance,
  budget,
  vaultCap,
  vaultFull,
  activeStep,
  onOpenBank,
}: ClubFlowBarProps) {
  const steps: {
    id: ClubFlowStep;
    emoji: string;
    label: string;
    value: number;
    alert?: boolean;
    tappable?: boolean;
  }[] = [
    {
      id: "units",
      emoji: "🏪",
      label: "واحدها",
      value: unitsPending,
      alert: unitsPending > 0 && activeStep === "units",
    },
    {
      id: "vault",
      emoji: "🔐",
      label: "گاوصندوق",
      value: vaultBalance,
      alert: vaultFull || activeStep === "vault",
      tappable: true,
    },
    {
      id: "budget",
      emoji: "💰",
      label: "بودجه",
      value: budget,
      alert: activeStep === "budget" && budget > 0,
      tappable: true,
    },
  ];

  return (
    <div className="club-flow">
      <div className="flex items-stretch gap-1">
        {steps.map((s, i) => {
          const active = activeStep === s.id;
          const hasValue = s.value > 0;
          const inner = (
            <div
              className={`club-flow-step flex-1 min-w-0 ${active ? "club-flow-step--active" : ""} ${s.alert && !active ? "club-flow-step--alert" : ""} ${s.tappable ? "club-flow-step--tap" : ""}`}
            >
              <span className="club-flow-step__num">{i + 1}</span>
              <span className="text-lg leading-none">{s.emoji}</span>
              <p className="mt-1 truncate text-[10px] font-bold text-white/55">
                {s.label}
              </p>
              <p
                className={`mt-0.5 text-xs font-extrabold truncate tabular-nums ${
                  hasValue || s.id === "vault" ? "text-gold-400" : "text-white/30"
                }`}
              >
                {flowValue(s.id, s.value, vaultCap)}
              </p>
            </div>
          );

          return (
            <div key={s.id} className="flex flex-1 items-center gap-0.5 min-w-0">
              {s.tappable && onOpenBank ? (
                <button
                  type="button"
                  onClick={onOpenBank}
                  className="flex-1 min-w-0 text-right"
                >
                  {inner}
                </button>
              ) : (
                inner
              )}
              {i < steps.length - 1 && (
                <span className="club-flow-arrow shrink-0" aria-hidden>
                  ‹
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
