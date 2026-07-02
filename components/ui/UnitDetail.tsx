"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useGame } from "@/lib/store";
import { faCount, faMoney, faNum } from "@/lib/format";
import { fanIncomeMultiplier } from "@/lib/economy";
import { managerDef } from "@/lib/managers";
import {
  unitDef,
  itemUpgradeCost,
  unitStats,
  itemEffectDescribe,
  itemEffectPerLevel,
  nextItemUnlockLevel,
  activeItemCount,
  ITEM_EFFECT_ICON,
  ITEM_EFFECT_NAME,
  type ItemDef,
} from "@/lib/units";

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="pt-2 pb-1">
      <p className="text-sm font-extrabold text-white/90">{title}</p>
      {sub && <p className="mt-0.5 text-[11px] text-white/50">{sub}</p>}
    </div>
  );
}

function ItemCard({
  item,
  lvl,
  unitLevel,
  budget,
  shake,
  onBuy,
}: {
  item: ItemDef;
  lvl: number;
  unitLevel: number;
  budget: number;
  shake: boolean;
  onBuy: () => void;
}) {
  const unlocked = unitLevel >= item.unlockLevel;
  const maxed = lvl >= item.maxLevel;
  const cost = itemUpgradeCost(item, lvl);
  const canBuy = unlocked && !maxed && budget >= cost;
  const shortfall = cost - budget;

  const effectClass =
    item.effect === "income"
      ? "unit-item-effect--income"
      : item.effect === "speed"
        ? "unit-item-effect--speed"
        : "unit-item-effect--capacity";

  if (!unlocked) {
    const levelsAway = item.unlockLevel - unitLevel;
    return (
      <div className="unit-item-card unit-item-card--locked rounded-2xl p-3.5">
        <div className="flex items-start gap-3">
          <div className="unit-item-icon unit-item-icon--locked grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl">
            {item.emoji}
          </div>
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center justify-end gap-2 flex-wrap">
              <span className="unit-item-lock-badge rounded-md px-2 py-0.5 text-[10px] font-bold">
                🔒 Lv.{faNum(item.unlockLevel)}
              </span>
              <p className="font-extrabold text-white/55">{item.name}</p>
            </div>
            <p className="mt-1.5 text-[11px] text-white/45 leading-5">
              {ITEM_EFFECT_ICON[item.effect]} {ITEM_EFFECT_NAME[item.effect]} ·{" "}
              {itemEffectPerLevel(item)} در هر سطح
            </p>
            <p className="mt-1 text-[10px] text-white/35">
              {levelsAway === 1
                ? "یک ارتقای واحد تا باز شدن"
                : `${faNum(levelsAway)} ارتقا تا باز شدن`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const pct = maxed ? 100 : Math.round((lvl / item.maxLevel) * 100);

  let action: ReactNode;
  if (maxed) {
    action = (
      <button disabled className="unit-item-btn unit-item-btn--maxed w-full rounded-xl py-3 text-sm font-extrabold">
        ✓ حداکثر — {itemEffectDescribe(item, lvl)}
      </button>
    );
  } else if (canBuy) {
    action = (
      <button
        onClick={onBuy}
        className="unit-item-btn unit-item-btn--buy btn-gold w-full rounded-xl py-3 text-sm font-extrabold active:scale-[0.98] transition"
      >
        {lvl === 0 ? "باز کردن" : "ارتقا"} · {faMoney(cost)}
      </button>
    );
  } else {
    action = (
      <button
        disabled
        className="unit-item-btn unit-item-btn--disabled w-full rounded-xl py-3 text-sm font-extrabold"
      >
        نیاز {faMoney(cost)} · {faMoney(shortfall)} کم داری
      </button>
    );
  }

  return (
    <div
      className={`unit-item-card rounded-2xl p-3.5 ${lvl > 0 ? "unit-item-card--active" : ""} ${
        shake ? "animate-shake" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`unit-item-icon grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl ${effectClass}`}
        >
          {item.emoji}
        </div>
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <span
              className={`unit-item-level rounded-md px-2 py-0.5 text-[10px] font-bold ${
                lvl > 0 ? "unit-item-level--active" : ""
              }`}
            >
              {lvl > 0 ? `سطح ${faNum(lvl)}/${faNum(item.maxLevel)}` : "آماده"}
            </span>
            <p className="font-extrabold text-white">{item.name}</p>
          </div>

          <div className="mt-2 flex flex-wrap justify-end gap-1.5">
            <span className={`unit-item-effect-pill ${effectClass}`}>
              {ITEM_EFFECT_ICON[item.effect]} {ITEM_EFFECT_NAME[item.effect]}
            </span>
            <span className="unit-item-effect-pill">
              {lvl > 0 ? itemEffectDescribe(item, lvl) : itemEffectPerLevel(item)}
            </span>
            {!maxed && lvl > 0 && (
              <span className="unit-item-effect-pill unit-item-effect-pill--next">
                → {itemEffectDescribe(item, lvl + 1)}
              </span>
            )}
          </div>

          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full unit-item-progress-track">
            <div
              className={`h-full rounded-full transition-all ${effectClass}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3">{action}</div>
    </div>
  );
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
  const fans = useGame((s) => s.fans);
  const managerId = useGame((s) => s.assign[unitId]);
  const upgradeItem = useGame((s) => s.upgradeItem);

  const [shakeId, setShakeId] = useState<string | null>(null);

  const manager = managerId ? managerDef(managerId) : null;
  const income = manager?.incomeMult ?? 1;
  const speed = manager?.speedMult ?? 1;
  const fanMult = fanIncomeMultiplier(fans);
  const stats = unitStats(def, unitLevel, itemLevels, income, speed, fanMult);

  const grouped = useMemo(() => {
    const active: ItemDef[] = [];
    const ready: ItemDef[] = [];
    const locked: ItemDef[] = [];
    for (const it of def.items) {
      const lvl = itemLevels[it.id] ?? 0;
      if (unitLevel < it.unlockLevel) locked.push(it);
      else if (lvl > 0) active.push(it);
      else ready.push(it);
    }
    return { active, ready, locked };
  }, [def.items, itemLevels, unitLevel]);

  const nextUnlock = nextItemUnlockLevel(def, unitLevel);
  const activeCount = activeItemCount(def, itemLevels);

  function buy(itemId: string) {
    if (upgradeItem(unitId, itemId) !== "ok") {
      setShakeId(itemId);
      setTimeout(() => setShakeId(null), 400);
    }
  }

  return (
    <div
      className="manager-sheet-backdrop fixed inset-0 z-[60] mx-auto flex max-w-[460px] flex-col justify-end"
      onClick={onClose}
    >
      <div
        className="manager-sheet animate-rise max-h-[88dvh] overflow-y-auto rounded-t-[28px] pb-10 no-scrollbar"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="sticky top-0 z-10 manager-sheet-header px-5 pt-4 pb-4">
          <div className="manager-sheet-handle mx-auto mb-4" />
          <div className="flex items-start justify-between gap-3">
            <button
              onClick={onClose}
              className="manager-sheet-close shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold active:scale-95"
            >
              بستن
            </button>
            <div className="flex-1 text-right min-w-0">
              <h3 className="text-lg font-extrabold leading-tight text-white">
                آیتم‌های {def.name} {def.emoji}
              </h3>
              <p className="mt-1.5 text-xs text-white/65 leading-5">
                {faNum(activeCount)}/{faNum(def.items.length)} فعال · هر آیتم اثرِ
                مستقیم روی درآمد، سرعت یا بافر
              </p>
            </div>
          </div>

          <div className="unit-item-stats-bar mt-4 grid grid-cols-3 gap-2 rounded-2xl p-3">
            <div className="text-center">
              <p className="text-[10px] text-white/50">درآمد/دوره</p>
              <p className="mt-0.5 text-sm font-extrabold text-gold-400">
                +{faMoney(stats.payout)}
              </p>
            </div>
            <div className="text-center border-x border-white/10">
              <p className="text-[10px] text-white/50">دوره</p>
              <p className="mt-0.5 text-sm font-extrabold text-white/90">
                {faNum(Math.round(stats.cycle))}ث
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-white/50">سقف بافر</p>
              <p className="mt-0.5 text-sm font-extrabold text-grass-400">
                {faMoney(stats.cap)}
              </p>
            </div>
          </div>

          <div className="manager-budget-bar mt-3 flex items-center justify-between rounded-2xl px-4 py-3">
            <span className="text-xs font-bold text-white/70">💰 بودجه</span>
            <span className="text-base font-extrabold text-gold-400">
              {faCount(budget)}
              <span className="text-xs text-white/55 mr-1">تومان</span>
            </span>
          </div>

          {nextUnlock !== null && (
            <p className="mt-3 rounded-xl unit-item-hint px-3 py-2 text-[11px] text-white/60 leading-5">
              💡 آیتمِ بعدی با <strong className="text-white/85">Lv.{faNum(nextUnlock)}</strong>{" "}
              واحد باز می‌شود — اول واحد را ارتقا بده.
            </p>
          )}
        </div>

        <div className="px-5 pb-2 space-y-3">
          {grouped.active.length > 0 && (
            <>
              <SectionTitle title="فعال" sub="در حال اعمال اثر روی واحد" />
              {grouped.active.map((it) => (
                <ItemCard
                  key={it.id}
                  item={it}
                  lvl={itemLevels[it.id] ?? 0}
                  unitLevel={unitLevel}
                  budget={budget}
                  shake={shakeId === it.id}
                  onBuy={() => buy(it.id)}
                />
              ))}
            </>
          )}

          {grouped.ready.length > 0 && (
            <>
              <SectionTitle title="آمادهٔ خرید" sub="باز شده — هنوز فعال نشده" />
              {grouped.ready.map((it) => (
                <ItemCard
                  key={it.id}
                  item={it}
                  lvl={0}
                  unitLevel={unitLevel}
                  budget={budget}
                  shake={shakeId === it.id}
                  onBuy={() => buy(it.id)}
                />
              ))}
            </>
          )}

          {grouped.locked.length > 0 && (
            <>
              <SectionTitle
                title="قفل"
                sub="با ارتقای سطحِ واحد باز می‌شوند"
              />
              {grouped.locked.map((it) => (
                <ItemCard
                  key={it.id}
                  item={it}
                  lvl={0}
                  unitLevel={unitLevel}
                  budget={budget}
                  shake={false}
                  onBuy={() => {}}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
