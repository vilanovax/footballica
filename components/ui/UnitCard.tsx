"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/store";
import { faNum, faMoney } from "@/lib/format";
import { fanIncomeMultiplier } from "@/lib/economy";
import { unitDef, unitStats, unitPending, unitUpgradeCost } from "@/lib/units";
import { isUnitUnlocked } from "@/lib/clubEconomy";
import { managerDef, RARITY_COLOR } from "@/lib/managers";
import { ManagerAvatar } from "@/components/ui/ManagerAvatar";
import { ManagerPanel } from "@/components/ui/ManagerPanel";
import { UnitDetail } from "@/components/ui/UnitDetail";

export function UnitCard({ id }: { id: string }) {
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

  // مدیرِ منصوب‌شده = برداشتِ خودکار
  useEffect(() => {
    if (locked || !managerId) return;
    const t = setInterval(() => collectUnit(id), 3000);
    return () => clearInterval(t);
  }, [id, locked, managerId, collectUnit]);

  if (locked) {
    return (
      <div className="mx-5 rounded-3xl bg-black/25 p-4 flex items-center gap-3 opacity-80">
        <span className="text-3xl grayscale">{def.emoji}</span>
        <div className="flex-1 text-right">
          <p className="font-extrabold">{def.name}</p>
          <p className="text-xs text-white/50">
            🔒 سطح {faNum(def.requiresLevel)} لازم · {def.flavor}
          </p>
        </div>
      </div>
    );
  }

  const level = unit?.level ?? 1;
  const last = unit?.lastCollect || now || 0;
  const fanMult = fanIncomeMultiplier(fans);
  const stats = unitStats(def, level, items, income, speed, fanMult);
  const pending = now
    ? unitPending(def, level, items, last, now, income, speed, fanMult)
    : 0;
  const pct = Math.min(100, (pending / stats.cap) * 100);
  const full = pending >= stats.cap;

  const maxed = level >= def.maxLevel;
  const upCost = unitUpgradeCost(def, level);
  const canUpgrade = !maxed && budget >= upCost;

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

  const rc = manager ? RARITY_COLOR[manager.rarity] : "#8aa0aa";
  const activeItems = def.items.filter((it) => (items[it.id] ?? 0) > 0).length;

  return (
    <>
      <div
        className={`mx-5 rounded-3xl p-4 ${flash ? "flash-green" : ""} ${
          full && !manager ? "ring-1 ring-gold-500/40" : ""
        }`}
        style={{ background: "linear-gradient(150deg,#14301f,#0f2018)" }}
      >
        {/* سرتیتر */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">{def.emoji}</span>
          <div className="flex-1 text-right">
            <p className="font-extrabold">
              {def.name}{" "}
              <span className="text-xs font-bold text-gold-400">
                سطح {faNum(level)}
              </span>
            </p>
            <p className="text-xs text-white/50">
              +{faMoney(stats.payout)} هر {faNum(Math.round(stats.cycle))} ثانیه
              {manager && (
                <span className="text-grass-400">
                  {" "}
                  (×{faNum(income.toFixed(2).replace(".", "٫"))})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* بافرِ درآمد */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className={full ? "font-bold text-gold-400" : "text-white/55"}>
            {full
              ? "پر شد — واریز کن"
              : manager
                ? "واریزِ خودکار به گاوصندوق"
                : "در حالِ جمع شدن…"}
          </span>
          <span className="font-bold">
            {faMoney(pending)} / {faMoney(stats.cap)}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/40">
          <div
            className="h-full rounded-full transition-[width] duration-1000 ease-linear"
            style={{
              width: `${pct}%`,
              background: full
                ? "linear-gradient(90deg,#e0a92e,#f5c542)"
                : "linear-gradient(90deg,#2f9e5f,#5ee08a)",
            }}
          />
        </div>

        {/* دکمه‌ها */}
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            {floatAmt !== null && (
              <span className="float-up pointer-events-none absolute -top-3 left-1/2 text-sm font-extrabold text-gold-400">
                +{faMoney(floatAmt)}
              </span>
            )}
            <button
              onClick={collect}
              disabled={pending <= 0}
              className={`w-full rounded-2xl py-2.5 text-sm font-extrabold transition ${
                pending > 0 ? "btn-gold" : "bg-white/8 text-white/35"
              } ${full ? "animate-pulse-soft" : ""}`}
            >
              {pending > 0 ? "واریز به گاوصندوق" : "در حالِ جمع…"}
            </button>
          </div>
          <button
            onClick={upgrade}
            className={`flex-1 rounded-2xl py-2.5 text-sm font-extrabold transition ${shake ? "animate-shake" : ""} ${
              maxed
                ? "bg-grass-500/15 text-grass-400"
                : canUpgrade
                  ? "bg-team-you text-white"
                  : "bg-white/8 text-white/35"
            }`}
          >
            {maxed
              ? "حداکثر ✓"
              : canUpgrade
                ? `ارتقا ${faMoney(upCost)}`
                : `نیاز ${faMoney(upCost)}`}
          </button>
        </div>

        {/* آیتم‌ها + مدیر */}
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => setDetail(true)}
            className="flex-1 rounded-2xl bg-white/5 py-2.5 text-sm font-bold text-white/80 active:scale-[0.98] transition"
          >
            🧩 آیتم‌ها ({faNum(activeItems)}/{faNum(def.items.length)})
          </button>
          <button
            onClick={() => setPanel(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white/5 py-2.5 text-sm font-bold active:scale-[0.98] transition"
          >
            {manager ? (
              <>
                <ManagerAvatar
                  img={manager.img}
                  emoji={manager.emoji}
                  color={rc}
                  size={26}
                />
                <span className="truncate text-grass-400">{manager.name}</span>
              </>
            ) : (
              <span className="text-gold-400">🧑‍💼 انتصابِ مدیر</span>
            )}
          </button>
        </div>
      </div>

      {panel && <ManagerPanel unitId={id} onClose={() => setPanel(false)} />}
      {detail && <UnitDetail unitId={id} onClose={() => setDetail(false)} />}
    </>
  );
}
