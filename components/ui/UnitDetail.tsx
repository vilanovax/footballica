"use client";

import { useMemo, useState } from "react";
import { BottomSheet, BottomSheetHandle, BottomSheetHeader } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { GameCard } from "@/components/ui/GameCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
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
  unitUpgradeCost,
  ITEM_EFFECT_ICON,
  ITEM_EFFECT_NAME,
  type ItemDef,
} from "@/lib/units";

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="unit-detail-section-head">
      <h4 className="unit-detail-section-head__title">{title}</h4>
      {sub && <p className="unit-detail-section-head__sub">{sub}</p>}
    </div>
  );
}

function effectTone(effect: ItemDef["effect"]) {
  return effect === "income"
    ? "income"
    : effect === "speed"
      ? "speed"
      : "capacity";
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
  const shortfall = Math.max(0, cost - budget);
  const tone = effectTone(item.effect);

  if (!unlocked) {
    const levelsAway = item.unlockLevel - unitLevel;
    return (
      <GameCard variant="locked" className="unit-item-card unit-item-card--locked">
        <div className="unit-item-card__top">
          <div className={`unit-item-icon unit-item-icon--locked unit-item-effect--${tone}`}>
            {item.emoji}
          </div>
          <div className="unit-item-card__body">
            <div className="unit-item-card__title-row">
              <span className="unit-item-lock-badge">سطح {faNum(item.unlockLevel)}</span>
              <h5 className="unit-item-card__name">{item.name}</h5>
            </div>
            <p className="unit-item-card__effect">
              {ITEM_EFFECT_ICON[item.effect]} {ITEM_EFFECT_NAME[item.effect]} ·{" "}
              {itemEffectPerLevel(item)} در هر سطح
            </p>
            <ProgressBar
              value={unitLevel}
              max={item.unlockLevel}
              tone="info"
              className="mt-2.5"
              trackClassName="h-1.5 unit-item-progress-track"
              fillClassName={`unit-item-effect--${tone}`}
            />
            <p className="unit-item-card__unlock-note">
              {levelsAway === 1
                ? "یک ارتقای واحد تا باز شدن"
                : `${faNum(levelsAway)} ارتقای واحد مانده`}
            </p>
          </div>
        </div>
      </GameCard>
    );
  }

  const pct = maxed ? 100 : Math.round((lvl / item.maxLevel) * 100);

  return (
    <GameCard
      variant="asset"
      highlight={canBuy && lvl === 0}
      className={`unit-item-card ${lvl > 0 ? "unit-item-card--active" : ""} ${
        shake ? "animate-shake" : ""
      }`}
    >
      <div className="unit-item-card__top">
        <div className={`unit-item-icon unit-item-effect--${tone}`}>{item.emoji}</div>
        <div className="unit-item-card__body">
          <div className="unit-item-card__title-row">
            <span className={`unit-item-level ${lvl > 0 ? "unit-item-level--active" : ""}`}>
              {lvl > 0 ? `سطح ${faNum(lvl)}/${faNum(item.maxLevel)}` : "آمادهٔ خرید"}
            </span>
            <h5 className="unit-item-card__name">{item.name}</h5>
          </div>
          <p className="unit-item-card__effect">
            {lvl > 0 ? itemEffectDescribe(item, lvl) : itemEffectPerLevel(item)}
            {!maxed && lvl > 0 && (
              <span className="unit-item-card__next">
                {" "}
                → {itemEffectDescribe(item, lvl + 1)}
              </span>
            )}
          </p>
          <ProgressBar
            value={pct}
            max={100}
            tone={tone === "income" ? "money" : tone === "speed" ? "info" : "success"}
            className="mt-2.5"
            trackClassName="h-1.5 unit-item-progress-track"
          />
        </div>
      </div>

      {maxed ? (
        <Button disabled variant="success" size="sm" fullWidth className="unit-item-btn--maxed mt-3">
          حداکثر — {itemEffectDescribe(item, lvl)}
        </Button>
      ) : canBuy ? (
        <Button
          onClick={onBuy}
          variant="primary"
          size="sm"
          fullWidth
          className="unit-item-btn--buy mt-3"
        >
          {lvl === 0 ? "باز کردن" : "ارتقا"} · {faMoney(cost)}
        </Button>
      ) : (
        <Button disabled variant="muted" size="sm" fullWidth className="unit-item-btn--disabled mt-3">
          نیاز {faMoney(cost)} · {faMoney(shortfall)} کم داری
        </Button>
      )}
    </GameCard>
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
  const upgradeUnit = useGame((s) => s.upgradeUnit);

  const [shakeId, setShakeId] = useState<string | null>(null);
  const [upgradeShake, setUpgradeShake] = useState(false);

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
  const unitMaxed = unitLevel >= def.maxLevel;
  const upgradeCost = unitUpgradeCost(def, unitLevel);
  const canUpgradeUnit = !unitMaxed && budget >= upgradeCost;
  const upgradeShortfall = Math.max(0, upgradeCost - budget);

  const nextReady = grouped.ready[0] ?? null;
  const nextReadyCost = nextReady ? itemUpgradeCost(nextReady, 0) : 0;
  const canBuyNextReady = Boolean(nextReady && budget >= nextReadyCost);

  function buy(itemId: string) {
    if (upgradeItem(unitId, itemId) !== "ok") {
      setShakeId(itemId);
      setTimeout(() => setShakeId(null), 400);
    }
  }

  function upgrade() {
    if (upgradeUnit(unitId) !== "ok") {
      setUpgradeShake(true);
      setTimeout(() => setUpgradeShake(false), 400);
    }
  }

  const nextAction =
    canBuyNextReady && nextReady
      ? {
          tone: "buy" as const,
          eyebrow: "حرکت بعدی",
          title: `باز کردن «${nextReady.name}»`,
          detail: `با ${faMoney(nextReadyCost)} اولین آیتم این ساختمان را فعال کن.`,
          cta: `باز کردن · ${faMoney(nextReadyCost)}`,
          onClick: () => buy(nextReady.id),
        }
      : nextReady
        ? {
            tone: "budget" as const,
            eyebrow: "نیاز به بودجه",
            title: `برای «${nextReady.name}» ${faMoney(nextReadyCost)} لازم است`,
            detail: `${faMoney(nextReadyCost - budget)} دیگر تا باز کردن اولین آیتم.`,
            cta: null,
            onClick: null,
          }
        : nextUnlock !== null
          ? canUpgradeUnit
            ? {
                tone: "upgrade" as const,
                eyebrow: "حرکت بعدی",
                title: `ارتقای واحد به سطح ${faNum(nextUnlock)}`,
                detail:
                  nextUnlock - unitLevel === 1
                    ? "یک ارتقا تا باز شدن آیتم بعدی."
                    : `${faNum(nextUnlock - unitLevel)} ارتقا تا باز شدن آیتم بعدی.`,
                cta: `ارتقای واحد · ${faMoney(upgradeCost)}`,
                onClick: upgrade,
              }
            : {
                tone: "budget" as const,
                eyebrow: "برای باز کردن آیتم‌ها",
                title: `ارتقای واحد به سطح ${faNum(nextUnlock)}`,
                detail: `${faMoney(upgradeShortfall)} دیگر برای ارتقای واحد لازم است.`,
                cta: null,
                onClick: null,
              }
          : null;

  return (
    <BottomSheet
      onClose={onClose}
      backdropClassName="manager-sheet-backdrop"
      panelClassName="unit-detail-sheet animate-rise pb-10 no-scrollbar"
    >
      <BottomSheetHeader className="unit-detail-header px-5 pt-4 pb-4">
        <BottomSheetHandle className="manager-sheet-handle mb-4" />
        <div className="flex items-start justify-between gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
            size="sm"
            className="manager-sheet-close shrink-0 px-3.5 text-xs font-bold"
          >
            بستن
          </Button>
          <div className="flex-1 text-right min-w-0">
            <p className="unit-detail-header__eyebrow">آیتم‌های ساختمان</p>
            <h3 className="unit-detail-header__title">
              {def.name} {def.emoji}
            </h3>
            <p className="unit-detail-header__sub">
              {faNum(activeCount)} از {faNum(def.items.length)} فعال · اثر روی درآمد، سرعت و بافر
            </p>
          </div>
        </div>

        <div className="unit-detail-stats mt-4">
          <div className="unit-detail-stat unit-detail-stat--income">
            <p className="unit-detail-stat__label">درآمد/دوره</p>
            <p className="unit-detail-stat__value">+{faMoney(stats.payout)}</p>
          </div>
          <div className="unit-detail-stat unit-detail-stat--cycle">
            <p className="unit-detail-stat__label">دوره</p>
            <p className="unit-detail-stat__value">{faNum(Math.round(stats.cycle))}ث</p>
          </div>
          <div className="unit-detail-stat unit-detail-stat--cap">
            <p className="unit-detail-stat__label">سقف بافر</p>
            <p className="unit-detail-stat__value">{faMoney(stats.cap)}</p>
          </div>
        </div>

        <div className="unit-detail-budget mt-3">
          <span className="unit-detail-budget__label">بودجهٔ خرید</span>
          <span className="unit-detail-budget__value">
            {faCount(budget)}
            <span className="unit-detail-budget__unit">تومان</span>
          </span>
        </div>

        {nextAction && (
          <GameCard
            variant="asset"
            highlight={nextAction.tone === "buy" || nextAction.tone === "upgrade"}
            className={`unit-detail-next-action unit-detail-next-action--${nextAction.tone} mt-3 rounded-2xl p-3.5 ${
              upgradeShake ? "animate-shake" : ""
            }`}
          >
            <div className="unit-detail-next-action__row">
              <div className="unit-detail-next-action__copy">
                <p className="unit-detail-next-action__eyebrow">{nextAction.eyebrow}</p>
                <p className="unit-detail-next-action__title">{nextAction.title}</p>
                <p className="unit-detail-next-action__sub">{nextAction.detail}</p>
              </div>
              {nextAction.cta && nextAction.onClick && (
                <Button onClick={nextAction.onClick} variant="primary" size="sm">
                  {nextAction.cta}
                </Button>
              )}
            </div>
          </GameCard>
        )}
      </BottomSheetHeader>

      <div className="unit-detail-body px-5 pb-2 space-y-3">
        {grouped.active.length > 0 && (
          <>
            <SectionHead title="فعال" sub="در حال اعمال اثر روی واحد" />
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
            <SectionHead title="آمادهٔ خرید" sub="باز شده — هنوز فعال نشده" />
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
            <SectionHead title="قفل" sub="با ارتقای سطح واحد باز می‌شوند" />
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
    </BottomSheet>
  );
}
