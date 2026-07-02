"use client";

import { faMoney } from "@/lib/format";

interface ClubFlowBarProps {
  unitsPending: number;
  vaultBalance: number;
  budget: number;
  vaultFull?: boolean;
}

export function ClubFlowBar({
  unitsPending,
  vaultBalance,
  budget,
  vaultFull,
}: ClubFlowBarProps) {
  const steps: {
    emoji: string;
    label: string;
    value: number;
    alert?: boolean;
  }[] = [
    { emoji: "🏪", label: "واحدها", value: unitsPending },
    {
      emoji: "🔐",
      label: "گاوصندوق",
      value: vaultBalance,
      alert: vaultFull,
    },
    { emoji: "💰", label: "بودجه", value: budget },
  ];

  return (
    <div className="mx-5 mt-3 rounded-2xl bg-black/25 px-3 py-3">
      <p className="mb-2.5 text-center text-[11px] font-bold text-white/45">
        مسیرِ پول: واحدها / جایزهٔ مسابقه → گاوصندوق → بودجه
      </p>
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-1 items-center gap-1 min-w-0">
            <div
              className={`flex-1 rounded-xl px-2 py-2 text-center min-w-0 ${
                s.alert ? "ring-1 ring-gold-500/60 bg-gold-500/10" : "bg-white/5"
              }`}
            >
              <p className="text-base leading-none">{s.emoji}</p>
              <p className="mt-1 truncate text-[10px] font-bold text-white/55">
                {s.label}
              </p>
              <p
                className={`mt-0.5 text-xs font-extrabold truncate ${
                  s.value > 0 ? "text-gold-400" : "text-white/35"
                }`}
              >
                {faMoney(s.value)}
              </p>
            </div>
            {i < steps.length - 1 && (
              <span className="shrink-0 text-[10px] text-white/25" aria-hidden>
                ←
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
