import { managerDef } from "./managers";
import { fanIncomeMultiplier } from "./economy";
import { levelForXp } from "./progress";
import { UNITS, unitDef, unitPending, unitStats } from "./units";
import { vaultCapacity } from "./vault";

/** واحد باز است (سطحِ کاربر کافی باشد) */
export function isUnitUnlocked(
  unitId: string,
  xp: number,
): boolean {
  const def = unitDef(unitId);
  return levelForXp(xp) >= def.requiresLevel;
}

/** snapshot درآمدِ واحدها برای UI */
export function unitIncomeSnapshot(state: {
  units: Record<string, { level: number; lastCollect: number }>;
  itemLevels: Record<string, Record<string, number>>;
  assign: Record<string, string | null>;
  xp: number;
  fans: number;
  vaultLevel: number;
  vaultBalance: number;
  now?: number;
}) {
  const now = state.now ?? Date.now();
  const fanMult = fanIncomeMultiplier(state.fans);
  let totalPending = 0;
  let readyCount = 0;
  let fullCount = 0;

  for (const u of UNITS) {
    if (!isUnitUnlocked(u.id, state.xp)) continue;
    const unit = state.units[u.id];
    if (!unit) continue;

    const m = state.assign[u.id] ? managerDef(state.assign[u.id]!) : null;
    const income = m?.incomeMult ?? 1;
    const speed = m?.speedMult ?? 1;
    const items = state.itemLevels[u.id] ?? {};
    const last = unit.lastCollect || now;
    const pending = unitPending(
      u,
      unit.level,
      items,
      last,
      now,
      income,
      speed,
      fanMult,
    );
    const { cap } = unitStats(u, unit.level, items, income, speed, fanMult);

    totalPending += pending;
    if (pending > 0) readyCount += 1;
    if (pending >= cap) fullCount += 1;
  }

  const vaultCap = vaultCapacity(state.vaultLevel);
  const vaultFree = Math.max(0, vaultCap - state.vaultBalance);
  const vaultFull = state.vaultBalance >= vaultCap;

  return { totalPending, readyCount, fullCount, vaultFree, vaultFull, vaultCap };
}

export type ClubFlowStep = "units" | "vault" | "budget";

export interface ClubNextAction {
  step: ClubFlowStep;
  title: string;
  detail: string;
  emoji: string;
}

/** پیشنهادِ قدم بعدی برای UI باشگاه */
export function clubNextAction(input: {
  totalPending: number;
  vaultBalance: number;
  vaultFull: boolean;
  vaultFree: number;
  readyCount: number;
  isBank: boolean;
}): ClubNextAction {
  const {
    totalPending,
    vaultBalance,
    vaultFull,
    vaultFree,
    readyCount,
    isBank,
  } = input;

  if (totalPending > 0 && vaultFree > 0 && !isBank) {
    return {
      step: "units",
      emoji: "🏪",
      title: "واریز از واحدها",
      detail:
        readyCount > 1
          ? `${readyCount} واحد درآمد آماده — به گاوصندوق بفرست`
          : "درآمد جمع شده — دکمهٔ واریز را بزن",
    };
  }
  if (vaultFull && !isBank) {
    return {
      step: "vault",
      emoji: "🔐",
      title: "گاوصندوق پر است",
      detail: "برداشت کن یا ظرفیت را ارتقا بده",
    };
  }
  if (vaultBalance > 0 && !isBank) {
    return {
      step: "vault",
      emoji: "💰",
      title: "برداشت به بودجه",
      detail: "پول در گاوصندوق است — برای ارتقا برداشت کن",
    };
  }
  if (totalPending > 0 && vaultFree <= 0 && !isBank) {
    return {
      step: "vault",
      emoji: "🔐",
      title: "گاوصندوق پر است",
      detail: "اول برداشت کن تا واحدها دوباره واریز کنند",
    };
  }
  return {
    step: "budget",
    emoji: "⚽",
    title: "درآمد در حال جمع شدن",
    detail: "بازی کن یا صبر کن تا واحدها پر شوند",
  };
}
