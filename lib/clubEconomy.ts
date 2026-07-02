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
