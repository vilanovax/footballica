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
  budget: number;
  now?: number;
}) {
  const now = state.now ?? Date.now();
  const fanMult = fanIncomeMultiplier(state.fans);
  let totalPending = 0;
  let readyCount = 0;
  let fullCount = 0;
  let topReady: { id: string; name: string; emoji: string; pending: number } | null =
    null;

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
    if (pending > 0) {
      readyCount += 1;
      if (!topReady || pending > topReady.pending) {
        topReady = {
          id: u.id,
          name: u.name.replace(/ِ باشگاه$/, ""),
          emoji: u.emoji,
          pending,
        };
      }
    }
    if (pending >= cap) fullCount += 1;
  }

  const vaultCap = vaultCapacity(state.vaultLevel);
  const safeBudget = Number.isFinite(state.budget) ? state.budget : 0;
  const vaultFree = Math.max(0, vaultCap - safeBudget);
  const vaultFull = safeBudget >= vaultCap;

  return {
    totalPending,
    readyCount,
    fullCount,
    vaultFree,
    vaultFull,
    vaultCap,
    topReady,
  };
}

export type ClubFlowStep = "units" | "treasury";

export interface ClubNextAction {
  step: ClubFlowStep;
  title: string;
  detail: string;
  emoji: string;
}

/** پیشنهادِ قدم بعدی برای UI باشگاه */
export function clubNextAction(input: {
  totalPending: number;
  budget: number;
  vaultFull: boolean;
  vaultFree: number;
  readyCount: number;
  isBank: boolean;
}): ClubNextAction {
  const { totalPending, budget, vaultFull, vaultFree, readyCount, isBank } =
    input;

  if (totalPending > 0 && vaultFree > 0 && !isBank) {
    return {
      step: "units",
      emoji: "🏪",
      title: "جمع‌آوری درآمد",
      detail:
        readyCount > 1
          ? `${readyCount} واحد درآمد آماده — به خزانه بفرست`
          : "درآمد جمع شده — دکمهٔ واریز را بزن",
    };
  }
  if (vaultFull && !isBank) {
    return {
      step: "treasury",
      emoji: "🔐",
      title: "خزانه پر است",
      detail: "خرج کن یا گاوصندوق را ارتقا بده",
    };
  }
  if (totalPending > 0 && vaultFree <= 0 && !isBank) {
    return {
      step: "treasury",
      emoji: "🔐",
      title: "خزانه پر است",
      detail: "خرج کن تا واحدها دوباره واریز کنند",
    };
  }
  if (budget > 0) {
    return {
      step: "treasury",
      emoji: "💰",
      title: "پول آمادهٔ خرج",
      detail: "واحد یا گاوصندوق را ارتقا بده",
    };
  }
  return {
    step: "treasury",
    emoji: "🔐",
    title: "خزانهٔ باشگاه",
    detail: "بازی کن یا صبر کن تا واحدها درآمد بسازند",
  };
}
