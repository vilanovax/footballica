"use client";

import { powerUpCount, type PowerUpDef } from "@/lib/powerups";
import type { PowerUpInventory } from "@/lib/powerups";
import { faNum } from "@/lib/format";

export interface PowerUpBarProps {
  defs: PowerUpDef[];
  inventory: PowerUpInventory;
  /** id → غیرفعال (بدون موجودی یا شرطِ بازی) */
  disabled?: Partial<Record<string, boolean>>;
  /** id → پنهان (مثلاً VAR فقط بعد از اشتباه) */
  hidden?: Partial<Record<string, boolean>>;
  onUse: (id: string) => void;
  shakeId?: string | null;
}

export function PowerUpBar({
  defs,
  inventory,
  disabled = {},
  hidden = {},
  onUse,
  shakeId,
}: PowerUpBarProps) {
  const visible = defs.filter((d) => !hidden[d.id]);
  if (visible.length === 0) return null;

  return (
    <div className="mx-5 mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {visible.map((p) => {
        const count = powerUpCount(inventory, p.id);
        const off = disabled[p.id] || count <= 0;
        return (
          <button
            key={p.id}
            type="button"
            disabled={off}
            onClick={() => onUse(p.id)}
            title={p.desc}
            className={`relative shrink-0 flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2 min-w-[64px] transition active:scale-[0.96] ${
              off
                ? "bg-white/5 text-white/30"
                : "bg-white/10 text-white ring-1 ring-white/15"
            } ${shakeId === p.id ? "animate-shake" : ""}`}
          >
            <span className="text-xl leading-none">{p.emoji}</span>
            <span className="text-[10px] font-bold truncate max-w-[56px]">
              {p.name}
            </span>
            <span
              className={`absolute -top-1 -left-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-extrabold ${
                count > 0 ? "bg-gold-400 text-[#3a2600]" : "bg-black/40 text-white/40"
              }`}
            >
              {faNum(count)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
