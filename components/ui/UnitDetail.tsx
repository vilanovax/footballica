"use client";

import { useState } from "react";
import { useGame } from "@/lib/store";
import { faNum, faMoney } from "@/lib/format";
import { unitDef, itemUpgradeCost, type ItemEffect } from "@/lib/units";

const EFFECT_LABEL: Record<ItemEffect, string> = {
  income: "درآمد",
  speed: "سرعت",
  capacity: "ظرفیت",
};

function effectText(effect: ItemEffect, amount: number): string {
  if (effect === "income") return `+${faMoney(amount)} درآمد`;
  if (effect === "speed") return `−${faNum(amount)} ثانیه`;
  return `+${faNum(amount)} ظرفیت`;
}

export function UnitDetail({
  unitId,
  onClose,
}: {
  unitId: string;
  onClose: () => void;
}) {
  const def = unitDef(unitId);
  const unitLevel = useGame((s) => s.units[unitId]?.level ?? 1);
  const itemLevels = useGame((s) => s.itemLevels[unitId]) ?? {};
  const budget = useGame((s) => s.budget);
  const upgradeItem = useGame((s) => s.upgradeItem);

  const [shakeId, setShakeId] = useState<string | null>(null);

  function buy(itemId: string) {
    if (upgradeItem(unitId, itemId) !== "ok") {
      setShakeId(itemId);
      setTimeout(() => setShakeId(null), 400);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] mx-auto flex max-w-[460px] flex-col justify-end bg-black/60"
      onClick={onClose}
    >
      <div
        className="animate-rise max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-pitch-800 p-5 pb-8 no-scrollbar"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="mb-1 flex items-center justify-between">
          <button onClick={onClose} className="text-sm font-bold text-white/50">
            بستن
          </button>
          <h3 className="text-lg font-extrabold">
            {def.name} {def.emoji}
          </h3>
        </div>
        <p className="mb-4 text-right text-xs text-white/45">
          هر آیتم یک اثرِ واضح دارد؛ با بالا رفتنِ سطحِ واحد باز می‌شوند.
        </p>

        <div className="space-y-3">
          {def.items.map((it) => {
            const lvl = itemLevels[it.id] ?? 0;
            const unlocked = unitLevel >= it.unlockLevel;
            const maxed = lvl >= it.maxLevel;
            const cost = itemUpgradeCost(it, lvl);
            const canBuy = unlocked && !maxed && budget >= cost;

            if (!unlocked) {
              return (
                <div
                  key={it.id}
                  className="flex items-center gap-3 rounded-2xl bg-black/25 p-3 opacity-70"
                >
                  <span className="text-2xl grayscale">{it.emoji}</span>
                  <div className="flex-1 text-right">
                    <p className="font-bold">{it.name}</p>
                    <p className="text-xs text-white/45">
                      🔒 با سطحِ {faNum(it.unlockLevel)}ِ واحد باز می‌شود
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={it.id}
                className={`flex items-center gap-3 rounded-2xl bg-white/5 p-3 ${
                  shakeId === it.id ? "animate-shake" : ""
                }`}
              >
                <span className="text-2xl">{it.emoji}</span>
                <div className="flex-1 text-right">
                  <p className="font-bold">
                    {it.name}{" "}
                    <span className="text-xs text-gold-400">سطح {faNum(lvl)}</span>
                  </p>
                  <p className="text-xs text-white/55">
                    {EFFECT_LABEL[it.effect]} · اکنون{" "}
                    {lvl > 0 ? effectText(it.effect, it.base * lvl) : "—"}
                    {!maxed && (
                      <span className="text-grass-400">
                        {" "}
                        → {effectText(it.effect, it.base * (lvl + 1))}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => buy(it.id)}
                  disabled={maxed}
                  className={`shrink-0 rounded-xl px-3 py-2 text-xs font-extrabold ${
                    maxed
                      ? "bg-grass-500/15 text-grass-400"
                      : canBuy
                        ? "btn-gold"
                        : "bg-white/8 text-white/35"
                  }`}
                >
                  {maxed
                    ? "حداکثر"
                    : `${lvl === 0 ? "باز کن" : "ارتقا"} · ${faMoney(cost)}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
