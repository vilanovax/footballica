"use client";

import { faMoney } from "@/lib/format";
import type { ClubFlowStep } from "@/lib/clubEconomy";

interface ClubFlowBarProps {
  unitsPending: number;
  vaultBalance: number;
  budget: number;
  vaultFull?: boolean;
  activeStep: ClubFlowStep;
}

export function ClubFlowBar({
  unitsPending,
  vaultBalance,
  budget,
  vaultFull,
  activeStep,
}: ClubFlowBarProps) {
  const steps: {
    id: ClubFlowStep;
    emoji: string;
    label: string;
    value: number;
    alert?: boolean;
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
    },
    {
      id: "budget",
      emoji: "💰",
      label: "بودجه",
      value: budget,
      alert: activeStep === "budget" && budget > 0,
    },
  ];

  return (
    <div className="club-flow">
      <div className="flex items-stretch gap-1">
        {steps.map((s, i) => {
          const active = activeStep === s.id;
          const hasValue = s.value > 0;
          return (
            <div key={s.id} className="flex flex-1 items-center gap-0.5 min-w-0">
              <div
                className={`club-flow-step flex-1 min-w-0 ${active ? "club-flow-step--active" : ""} ${s.alert && !active ? "club-flow-step--alert" : ""}`}
              >
                <span className="club-flow-step__num">{i + 1}</span>
                <span className="text-lg leading-none">{s.emoji}</span>
                <p className="mt-1 truncate text-[10px] font-bold text-white/55">
                  {s.label}
                </p>
                <p
                  className={`mt-0.5 text-xs font-extrabold truncate ${
                    hasValue ? "text-gold-400" : "text-white/30"
                  }`}
                >
                  {faMoney(s.value)}
                </p>
              </div>
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
