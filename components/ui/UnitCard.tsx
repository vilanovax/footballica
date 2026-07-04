"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GameCard } from "@/components/ui/GameCard";
import { useGame } from "@/lib/store";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RARITY_THEME } from "@/lib/designSystem";
import { faNum, faMoney, faTreasuryShort } from "@/lib/format";
import { fanIncomeMultiplier } from "@/lib/economy";
import { levelForXp } from "@/lib/progress";
import { unitDef, unitStats, unitPending, unitUpgradeCost, activeItemCount } from "@/lib/units";
import { isUnitUnlocked } from "@/lib/clubEconomy";
import { managerDef } from "@/lib/managers";
import { ManagerAvatar } from "@/components/ui/ManagerAvatar";
import { ManagerPanel } from "@/components/ui/ManagerPanel";
import { UnitDetail } from "@/components/ui/UnitDetail";

export function UnitCard({
  id,
  vaultFull = false,
}: {
  id: string;
  vaultFull?: boolean;
}) {
  const def = unitDef(id);
  const unit = useGame((s) => s.units[id]);
  const itemLevels = useGame((s) => s.itemLevels[id]);
  const managerId = useGame((s) => s.assign[id]);
  const xp = useGame((s) => s.xp);
  const fans = useGame((s) => s.fans);
  const budget = useGame((s) => s.budget);
  const ensureUnitClock = useGame((s) => s.ensureUnitClock);
  const collectUnit = useGame((s) => s.collectUnit);
  const upgradeUnit = useGame((s) => s.upgradeUnit);

  const manager = managerId ? managerDef(managerId) : null;
  const income = manager?.incomeMult ?? 1;
  const speed = manager?.speedMult ?? 1;
  const items = itemLevels ?? {};

  const playerLevel = levelForXp(xp);
  const locked = !isUnitUnlocked(id, xp);

  const [now, setNow] = useState<number | null>(null);
  const [floatAmt, setFloatAmt] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);
  const [panel, setPanel] = useState(false);
  const [detail, setDetail] = useState(false);

  useEffect(() => {
    if (locked) return;
    ensureUnitClock(id);
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [id, locked, ensureUnitClock]);

  useEffect(() => {
    if (locked || !managerId) return;
    collectUnit(id);
    const t = setInterval(() => collectUnit(id), 3000);
    return () => clearInterval(t);
  }, [id, locked, managerId, collectUnit]);

  if (locked) {
    const need = def.requiresLevel;
    return (
      <GameCard
        variant="locked"
        className="club-unit-locked mx-5 flex items-center gap-3 rounded-2xl p-3.5"
      >
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-black/25 text-2xl grayscale opacity-60">
          {def.emoji}
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="font-extrabold text-white/70">{def.name}</p>
          <p className="mt-0.5 text-[11px] text-white/40 leading-5">
            🔒 سطح {faNum(need)} · {def.flavor}
          </p>
          <ProgressBar
            value={playerLevel}
            max={need}
            tone="info"
            className="mt-2"
            trackClassName="h-1"
            fillClassName="bg-white/20"
          />
          <p className="mt-1 text-[10px] text-white/35">
            سطح تو: {faNum(playerLevel)} / {faNum(need)}
          </p>
        </div>
      </GameCard>
    );
  }

  const level = unit?.level ?? 1;
  const last = unit?.lastCollect || now || 0;
  const fanMult = fanIncomeMultiplier(fans);
  const stats = unitStats(def, level, items, income, speed, fanMult);
  const pending = now
    ? unitPending(def, level, items, last, now, income, speed, fanMult)
    : 0;
  const full = pending >= stats.cap;
  const ready = pending > 0;

  const maxed = level >= def.maxLevel;
  const upCost = unitUpgradeCost(def, level);
  const canUpgrade = !maxed && budget >= upCost;

  const canDeposit = ready && !vaultFull;

  function collect() {
    const got = collectUnit(id);
    if (got > 0) {
      setFloatAmt(got);
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
      setTimeout(() => setFloatAmt(null), 900);
    }
  }
  function upgrade() {
    if (upgradeUnit(id) !== "ok") {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  const rc = manager ? RARITY_THEME[manager.rarity].color : "var(--color-rarity-common)";
  const activeItems = activeItemCount(def, items);

  return (
    <>
      <GameCard
        variant="asset"
        highlight={ready && !manager}
        className={`club-unit-card mx-5 rounded-3xl p-4 ${flash ? "flash-green" : ""} ${
          full && !manager ? "ring-1 ring-gold-500/45" : ""
        } ${ready && !manager ? "club-unit-card--ready" : ""}`}
      >
        <div className="flex items-start gap-3">
          <div className="club-building-icon grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-[1.9rem]">
            {def.emoji}
          </div>
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center justify-end gap-2 flex-wrap">
              <span className="rounded-md bg-gold-500/15 px-2 py-0.5 text-[10px] font-bold text-gold-400">
                سطح {faNum(level)}
              </span>
              <h4 className="font-extrabold truncate">{def.name}</h4>
            </div>
            <p className="mt-1 text-[11px] text-white/48 leading-5">
              {def.flavor}
            </p>
          </div>
          {manager && (
            <ManagerAvatar
              img={manager.img}
              emoji={manager.emoji}
              color={rc}
              size={36}
            />
          )}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="club-building-stat rounded-2xl px-2.5 py-2.5 text-right">
            <p className="text-[10px] font-bold text-white/38">آماده</p>
            <p className="mt-1 text-sm font-extrabold text-gold-400">
              {faMoney(pending)}
            </p>
            <p className="mt-1 text-[10px] text-white/35">برای جمع‌آوری</p>
          </div>
          <div className="club-building-stat rounded-2xl px-2.5 py-2.5 text-right">
            <p className="text-[10px] font-bold text-white/38">درآمد</p>
            <p className="mt-1 text-sm font-extrabold text-white">
              +{faMoney(stats.payout)}
            </p>
            <p className="mt-1 text-[10px] text-white/35">
              هر {faNum(Math.round(stats.cycle))}ث
            </p>
          </div>
          <div className="club-building-stat rounded-2xl px-2.5 py-2.5 text-right">
            <p className="text-[10px] font-bold text-white/38">ظرفیت</p>
            <p className="mt-1 text-sm font-extrabold text-white/80">
              {faMoney(stats.cap)}
            </p>
            <p className="mt-1 text-[10px] text-white/35">
              پر: {faMoney(pending)}
              {manager && (
                <span className="text-grass-400 mr-1">
                  · ×{faNum(income.toFixed(1).replace(".", "٫"))}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
              vaultFull && ready
                ? "bg-team-foe/12 text-team-foe"
                : ready
                  ? "bg-grass-500/12 text-grass-400"
                  : "bg-white/6 text-white/38"
            }`}
          >
            {vaultFull && ready
              ? "خزانه پر"
              : ready
                ? "آمادهٔ جمع‌آوری"
                : manager
                  ? "مدیر فعال"
                  : "در حال درآمدسازی"}
          </span>
          <p className="text-[10px] text-white/35 text-right leading-5">
            {manager
              ? "این ساختمان با مدیر، درآمد را خودش جمع می‌کند."
              : "جمع‌آوری کن تا درآمد وارد خزانه شود."}
          </p>
        </div>

        <ProgressBar
          value={pending}
          max={stats.cap}
          tone={full ? "money" : ready ? "success" : "info"}
          className="mt-3"
          trackClassName="h-1.5"
          fillClassName={!ready ? "bg-white/15" : undefined}
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="relative">
            {floatAmt !== null && (
              <span className="float-up pointer-events-none absolute -top-3 left-1/2 text-xs font-extrabold text-gold-400 z-10">
                +{faMoney(floatAmt)}
              </span>
            )}
            <Button
              onClick={collect}
              disabled={!canDeposit}
              variant={canDeposit ? "primary" : "muted"}
              size="md"
              fullWidth
              className={full && canDeposit ? "animate-pulse-soft" : undefined}
            >
              {vaultFull && ready
                ? "خزانه پر"
                : ready
                  ? `جمع‌آوری ${faTreasuryShort(pending)}`
                  : "جمع…"}
            </Button>
          </div>
          <Button
            onClick={upgrade}
            variant={maxed ? "success" : canUpgrade ? "accent" : "muted"}
            size="md"
            fullWidth
            shake={shake}
          >
            {maxed ? "حداکثر" : canUpgrade ? "ارتقای ساختمان" : `نیاز ${faMoney(upCost)}`}
          </Button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            onClick={() => setDetail(true)}
            variant={activeItems > 0 ? "success" : "secondary"}
            size="sm"
            fullWidth
            className="text-xs font-bold"
          >
            {`ارتقای آیتم‌ها ${faNum(activeItems)}/${faNum(def.items.length)}`}
          </Button>
          <Button
            onClick={() => setPanel(true)}
            variant="secondary"
            size="sm"
            fullWidth
            className="text-xs font-bold"
          >
            {manager ? (
              <span className="text-grass-400 truncate">{manager.name}</span>
            ) : (
              <span className="text-gold-400">استخدام مدیر</span>
            )}
          </Button>
        </div>
      </GameCard>

      {panel && <ManagerPanel unitId={id} onClose={() => setPanel(false)} />}
      {detail && <UnitDetail unitId={id} onClose={() => setDetail(false)} />}
    </>
  );
}

/** کارت فشرده برای واحدهای قفل — در لیست «به‌زودی» */
export function LockedUnitRow({ id }: { id: string }) {
  const def = unitDef(id);
  const xp = useGame((s) => s.xp);
  const playerLevel = levelForXp(xp);
  const need = def.requiresLevel;

  return (
    <GameCard
      variant="locked"
      className="club-build-next-card rounded-2xl px-3 py-3 text-right"
    >
      <div className="flex items-start gap-3">
        <div className="club-build-next-card__icon grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-2xl">
          {def.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-gold-400/80">
              باز می‌شود در سطح {faNum(need)}
            </span>
            <p className="text-sm font-extrabold text-white truncate">{def.name}</p>
          </div>
          <p className="mt-1 text-[11px] text-white/48 leading-5">{def.flavor}</p>
          <p className="mt-1.5 text-[10px] text-white/35">
            پیشرفت تو: {faNum(playerLevel)} / {faNum(need)}
          </p>
        </div>
      </div>
    </GameCard>
  );
}
