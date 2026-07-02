"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useGame } from "@/lib/store";
import { faMoney, faNum, faCount } from "@/lib/format";
import {
  managersFor,
  RARITY_COLOR,
  type ManagerDef,
  type Rarity,
} from "@/lib/managers";
import { unitDef } from "@/lib/units";
import { ManagerAvatar } from "@/components/ui/ManagerAvatar";

const RARITY_ORDER: Rarity[] = ["معمولی", "حرفه‌ای", "ستاره", "افسانه‌ای"];

function ManagerStatPill({
  icon,
  label,
  accent,
}: {
  icon: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <span
      className={`manager-stat-pill inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
        accent ? "manager-stat-pill--accent" : ""
      }`}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
}

function ManagerCard({
  manager: m,
  budget,
  isHired,
  assignedHere,
  assignedElsewhere,
  onHire,
  onAssign,
  onUnassign,
  shake,
}: {
  manager: ManagerDef;
  budget: number;
  isHired: boolean;
  assignedHere: boolean;
  assignedElsewhere: boolean;
  onHire: () => void;
  onAssign: () => void;
  onUnassign: () => void;
  shake: boolean;
}) {
  const rc = RARITY_COLOR[m.rarity];
  const canHire = !isHired && budget >= m.cost;
  const speedPct = Math.round((m.speedMult - 1) * 100);
  const isLegendary = m.rarity === "افسانه‌ای";

  let action: ReactNode;
  if (assignedHere) {
    action = (
      <button
        onClick={onUnassign}
        className="manager-btn manager-btn--active w-full rounded-xl py-2.5 text-sm font-extrabold"
      >
        ✓ منصوب — لغو
      </button>
    );
  } else if (isHired) {
    action = (
      <button
        onClick={onAssign}
        disabled={assignedElsewhere}
        className={`manager-btn w-full rounded-xl py-3 text-sm font-extrabold active:scale-[0.98] transition ${
          assignedElsewhere
            ? "manager-btn--disabled"
            : "manager-btn--assign bg-team-you text-white"
        }`}
      >
        {assignedElsewhere ? "روی واحد دیگر" : "انتصاب به این واحد"}
      </button>
    );
  } else {
    action = (
      <button
        onClick={onHire}
        disabled={!canHire}
        className={`manager-btn w-full rounded-xl py-3 text-sm font-extrabold active:scale-[0.98] transition ${
          canHire ? "manager-btn--hire btn-gold" : "manager-btn--disabled"
        }`}
      >
        {canHire ? (
          <>استخدام · {faMoney(m.cost)}</>
        ) : (
          <>
            <span className="text-white/75">نیاز {faMoney(m.cost)}</span>
            <span className="block text-[11px] font-bold text-white/50 mt-1">
              {faMoney(m.cost - budget)} کم داری · بودجه {faMoney(budget)}
            </span>
          </>
        )}
      </button>
    );
  }

  return (
    <article
      className={`manager-card rounded-2xl p-3.5 ${shake ? "animate-shake" : ""} ${
        assignedHere ? "manager-card--assigned" : ""
      } ${isLegendary ? "manager-card--legend" : ""}`}
      style={
        isLegendary && !assignedHere
          ? { borderColor: `${rc}55` }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        <ManagerAvatar img={m.img} emoji={m.emoji} color={rc} size={52} />
        <div className="flex-1 min-w-0 text-right">
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <span
              className="rounded-md px-2 py-0.5 text-[10px] font-extrabold border"
              style={{
                background: `${rc}22`,
                color: rc,
                borderColor: `${rc}55`,
              }}
            >
              {m.rarity}
            </span>
            <h4 className="font-extrabold text-[15px] leading-tight text-white">{m.name}</h4>
          </div>
          <div className="mt-2 flex flex-wrap justify-end gap-1.5">
            <ManagerStatPill
              icon="💰"
              label={`×${faNum(m.incomeMult.toFixed(2).replace(".", "٫"))}`}
            />
            <ManagerStatPill icon="⚡" label={`+${faNum(speedPct)}٪`} />
            {m.target === "all" && (
              <ManagerStatPill icon="🌐" label="همه‌کاره" accent />
            )}
            {isHired && (
              <ManagerStatPill icon="✓" label="استخدام‌شده" accent />
            )}
          </div>
          <p className="mt-2.5 text-[11px] text-white/60 leading-5">
            🤖 واریز خودکار هر ۳ ثانیه به گاوصندوق
          </p>
        </div>
      </div>
      <div className="mt-3">{action}</div>
    </article>
  );
}

function SectionTitle({
  title,
  sub,
}: {
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-2 mt-4 first:mt-0 text-right">
      <h4 className="text-sm font-extrabold text-white">{title}</h4>
      {sub && <p className="text-[11px] text-white/55 mt-0.5">{sub}</p>}
    </div>
  );
}

export function ManagerPanel({
  unitId,
  onClose,
}: {
  unitId: string;
  onClose: () => void;
}) {
  const budget = useGame((s) => s.budget);
  const hired = useGame((s) => s.hired);
  const assign = useGame((s) => s.assign);
  const hireManager = useGame((s) => s.hireManager);
  const assignManager = useGame((s) => s.assignManager);
  const unassignUnit = useGame((s) => s.unassignUnit);

  const def = unitDef(unitId);
  const list = managersFor(unitId);
  const [shakeId, setShakeId] = useState<string | null>(null);

  const assignedId = assign[unitId];
  const assignedManager = assignedId
    ? list.find((m) => m.id === assignedId)
    : null;

  const grouped = useMemo(() => {
    const assigned = assignedManager ? [assignedManager] : [];
    const hiredAvailable = list.filter(
      (m) => hired[m.id] && m.id !== assignedId,
    );
    const unitSpecialists = list.filter(
      (m) => !hired[m.id] && m.target !== "all",
    );
    const allRounders = list.filter(
      (m) => !hired[m.id] && m.target === "all",
    );

    const byRarity = (a: ManagerDef, b: ManagerDef) =>
      RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) ||
      a.cost - b.cost;

    return {
      assigned,
      hiredAvailable: [...hiredAvailable].sort(byRarity),
      unitSpecialists: [...unitSpecialists].sort(byRarity),
      allRounders: [...allRounders].sort(byRarity),
    };
  }, [list, hired, assignedId, assignedManager]);

  function shake(id: string) {
    setShakeId(id);
    setTimeout(() => setShakeId(null), 400);
  }

  function assignedElsewhere(managerId: string) {
    return Object.entries(assign).some(
      ([uid, mid]) => uid !== unitId && mid === managerId,
    );
  }

  function renderCard(m: ManagerDef) {
    const isHired = Boolean(hired[m.id]);
    const assignedHere = assign[unitId] === m.id;
    return (
      <ManagerCard
        key={m.id}
        manager={m}
        budget={budget}
        isHired={isHired}
        assignedHere={assignedHere}
        assignedElsewhere={assignedElsewhere(m.id)}
        shake={shakeId === m.id}
        onHire={() => {
          if (hireManager(m.id) !== "ok") shake(m.id);
        }}
        onAssign={() => {
          if (assignManager(unitId, m.id) !== "ok") shake(m.id);
        }}
        onUnassign={() => unassignUnit(unitId)}
      />
    );
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
                مدیر {def.name} {def.emoji}
              </h3>
              <p className="mt-1.5 text-xs text-white/65 leading-5">
                استخدام → انتصاب → واریز خودکار + ضریب درآمد
              </p>
            </div>
          </div>
          <div className="manager-budget-bar mt-4 flex items-center justify-between rounded-2xl px-4 py-3">
            <span className="text-xs font-bold text-white/70">💰 بودجهٔ قابلِ خرج</span>
            <span className="text-base font-extrabold text-gold-400">
              {faCount(budget)}
              <span className="text-xs text-white/55 mr-1">تومان</span>
            </span>
          </div>
        </div>

        <div className="px-5 pb-2 space-y-3">
          {grouped.assigned.length > 0 && (
            <>
              <SectionTitle title="مدیر فعال" sub="روی این واحد منصوب است" />
              {grouped.assigned.map(renderCard)}
            </>
          )}

          {grouped.hiredAvailable.length > 0 && (
            <>
              <SectionTitle
                title="استخدام‌شده — آمادهٔ انتصاب"
                sub="مدیرانی که داری ولی این‌جا نیستند"
              />
              {grouped.hiredAvailable.map(renderCard)}
            </>
          )}

          {grouped.unitSpecialists.length > 0 && (
            <>
              <SectionTitle
                title="استخدام جدید"
                sub={`متخصص ${def.name}`}
              />
              {grouped.unitSpecialists.map(renderCard)}
            </>
          )}

          {grouped.allRounders.length > 0 && (
            <>
              <SectionTitle
                title="مدیران همه‌کاره"
                sub="روی هر واحدی می‌نشینند"
              />
              {grouped.allRounders.map(renderCard)}
            </>
          )}

          {list.length === 0 && (
            <p className="py-8 text-center text-sm text-white/45">
              مدیری برای این واحد تعریف نشده.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
