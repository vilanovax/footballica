"use client";

import { useMemo, useState, type ReactNode } from "react";
import { RARITY_ORDER, RARITY_THEME } from "@/lib/designSystem";
import { useGame } from "@/lib/store";
import { faMoney, faNum, faTreasuryShort } from "@/lib/format";
import {
  managersFor,
  type ManagerDef,
} from "@/lib/managers";
import { unitDef } from "@/lib/units";
import { ManagerAvatar } from "@/components/ui/ManagerAvatar";

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

function shortUnitName(unitName: string): string {
  return unitName.replace("ِ باشگاه", "");
}

function managerScoutNote(m: ManagerDef): string {
  return m.hook;
}

function managerStatusCopy(input: {
  isHired: boolean;
  assignedHere: boolean;
  assignedElsewhere: boolean;
  canHire: boolean;
  budget: number;
  cost: number;
}): { title: string; note: string } {
  const { isHired, assignedHere, assignedElsewhere, canHire, budget, cost } = input;
  if (assignedHere) {
    return {
      title: "فرمان این ساختمان دست اوست",
      note: "جمع‌آوری این ساختمان به‌صورت خودکار انجام می‌شود.",
    };
  }
  if (isHired && assignedElsewhere) {
    return {
      title: "در ساختمان دیگری مشغول است",
      note: "اگر این‌جا می‌خواهی، باید از آن ساختمان جدا شود.",
    };
  }
  if (isHired) {
    return {
      title: "روی نیمکت آماده است",
      note: "همین حالا می‌توانی او را به این ساختمان منصوب کنی.",
    };
  }
  if (canHire) {
    return {
      title: `استخدام: ${faMoney(cost)}`,
      note: "بعد از استخدام، روی نیمکت باشگاه می‌نشیند و بعد می‌توانی منصوبش کنی.",
    };
  }
  return {
    title: `${faMoney(cost - budget)} دیگر نیاز داری`,
    note: `برای قرارداد باید خزانه به ${faMoney(cost)} برسد.`,
  };
}

function ManagerCard({
  manager: m,
  unitName,
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
  unitName: string;
  budget: number;
  isHired: boolean;
  assignedHere: boolean;
  assignedElsewhere: boolean;
  onHire: () => void;
  onAssign: () => void;
  onUnassign: () => void;
  shake: boolean;
}) {
  const rcTheme = RARITY_THEME[m.rarity];
  const rc = rcTheme.color;
  const canHire = !isHired && budget >= m.cost;
  const speedPct = Math.round((m.speedMult - 1) * 100);
  const isLegendary = m.rarity === "افسانه‌ای";
  const unitLabel = shortUnitName(unitName);
  const shortfall = Math.max(0, m.cost - budget);
  const fundingPct = Math.max(0, Math.min(100, (budget / m.cost) * 100));
  const status = managerStatusCopy({
    isHired,
    assignedHere,
    assignedElsewhere,
    canHire,
    budget,
    cost: m.cost,
  });

  let action: ReactNode;
  if (assignedHere) {
    action = (
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          className="manager-btn manager-btn--active rounded-xl py-2.5 text-sm font-extrabold"
        >
          ✓ مدیر فعال این ساختمان
        </button>
        <button
          type="button"
          onClick={onUnassign}
          className="manager-btn manager-btn--subtle rounded-xl px-3 py-2.5 text-xs font-bold active:scale-[0.98]"
        >
          جابه‌جا
        </button>
      </div>
    );
  } else if (isHired) {
    action = (
      <button
        type="button"
        onClick={onAssign}
        disabled={assignedElsewhere}
        className={`manager-btn w-full rounded-xl py-3 text-sm font-extrabold active:scale-[0.98] transition ${
          assignedElsewhere
            ? "manager-btn--disabled"
            : "manager-btn--assign bg-team-you text-white"
        }`}
      >
        {assignedElsewhere ? "اول از ساختمان دیگر بردارش" : `انتصاب به ${unitLabel}`}
      </button>
    );
  } else {
    action = (
      <button
        type="button"
        onClick={onHire}
        disabled={!canHire}
        className={`manager-btn w-full rounded-xl py-3 text-sm font-extrabold active:scale-[0.98] transition ${
          canHire ? "manager-btn--hire btn-gold" : "manager-btn--disabled"
        }`}
      >
        {canHire ? `استخدام برای باشگاه · ${faMoney(m.cost)}` : `نیاز به ${faMoney(shortfall)} بیشتر`}
      </button>
    );
  }

  return (
    <article
      className={`manager-card manager-contract rounded-[1.35rem] p-3.5 ${
        shake ? "animate-shake" : ""
      } ${assignedHere ? "manager-card--assigned" : ""} ${
        isLegendary ? "manager-card--legend" : ""
      }`}
      style={
        isLegendary && !assignedHere
          ? { borderColor: rcTheme.border }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        <div className="manager-portrait-shell shrink-0">
          <ManagerAvatar img={m.img} emoji={m.emoji} color={rc} size={58} />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <span
              className="manager-contract__rarity rounded-md px-2 py-0.5 text-[10px] font-extrabold border"
              style={{
                background: rcTheme.soft,
                color: rcTheme.color,
                borderColor: rcTheme.border,
              }}
            >
              {m.rarity}
            </span>
            {m.target === "all" && (
              <span className="manager-contract__target rounded-md px-2 py-0.5 text-[10px] font-bold">
                همه‌کاره
              </span>
            )}
            <h4 className="font-extrabold text-[15px] leading-tight text-white">
              {m.name}
            </h4>
          </div>

          <p className="mt-1 text-[11px] text-white/48 leading-5">
            {managerScoutNote(m)}
          </p>

          <div className="mt-2 flex flex-wrap justify-end gap-1.5">
            <ManagerStatPill
              icon="💰"
              label={`درآمد ${unitLabel} ×${faNum(m.incomeMult.toFixed(2).replace(".", "٫"))}`}
            />
            <ManagerStatPill icon="⚡" label={`سرعت تولید +${faNum(speedPct)}٪`} />
            {isHired && !assignedHere && (
              <ManagerStatPill icon="🎒" label="در باشگاه" accent />
            )}
          </div>
        </div>
      </div>

      <div className="manager-contract__status mt-3 rounded-xl px-3 py-2.5 text-right">
        <p className="text-[11px] font-extrabold text-white/88">{status.title}</p>
        <p className="mt-1 text-[10px] text-white/46 leading-5">{status.note}</p>
      </div>

      <div className="manager-contract__footer mt-3 grid gap-2">
        {!isHired && (
          <div className="manager-afford rounded-xl px-3 py-2.5 text-right">
            <div className="flex items-center justify-between gap-3 text-[10px] text-white/45">
              <span>هزینه استخدام</span>
              <span>{faMoney(budget)} / {faMoney(m.cost)}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/30">
              <div
                className="h-full rounded-full bg-gold-400/80 transition-[width] duration-500"
                style={{ width: `${fundingPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-white/38">
              {canHire
                ? "خزانه برای قرارداد آماده است."
                : `${faMoney(shortfall)} دیگر نیاز داری`}
            </p>
          </div>
        )}
        {action}
        {isHired && !assignedHere && (
          <p className="text-[10px] text-white/38 text-right">
            استخدام شده است؛ برای اثرگذاری باید روی {unitLabel} منصوبش کنی.
          </p>
        )}
      </div>
    </article>
  );
}

function SectionTitle({
  title,
  sub,
  icon,
}: {
  title: string;
  sub?: string;
  icon?: string;
}) {
  return (
    <div className="mb-2 mt-4 first:mt-0 text-right">
      <h4 className="text-sm font-extrabold text-white">
        {icon && <span className="ml-1">{icon}</span>}
        {title}
      </h4>
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
        unitName={def.name}
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
      className="manager-sheet-backdrop fixed inset-0 z-60 mx-auto flex max-w-[460px] flex-col justify-end"
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
              type="button"
              onClick={onClose}
              className="manager-sheet-close shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold active:scale-95"
            >
              بستن
            </button>
            <div className="flex-1 text-right min-w-0">
              <p className="text-[10px] font-bold tracking-wide text-gold-400/75">
                اتاق مدیریت
              </p>
              <h3 className="mt-1 text-lg font-extrabold leading-tight text-white">
                مدیر {def.name} {def.emoji}
              </h3>
              <p className="mt-1.5 text-xs text-white/60 leading-5">
                مدیرها جمع‌آوری این ساختمان را خودکار می‌کنند و درآمدش را بالا می‌برند.
              </p>
            </div>
          </div>
          <div className="manager-budget-bar mt-4 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-white/68">💼 هزینه استخدام مدیر</span>
              <span className="text-base font-extrabold text-gold-400">
                {faTreasuryShort(budget)}
                <span className="text-xs text-white/50 mr-1">تومان</span>
              </span>
            </div>
            <p className="mt-1.5 text-[10px] text-white/42 text-right">
              بعد از استخدام، فقط کافی‌ست مدیر را روی این ساختمان منصوب کنی.
            </p>
          </div>
        </div>

        <div className="px-5 pb-2 space-y-3">
          {grouped.assigned.length > 0 && (
            <>
              <SectionTitle
                icon="👑"
                title="مدیر فعال"
                sub="الان فرمان این ساختمان را در دست دارد"
              />
              {grouped.assigned.map(renderCard)}
            </>
          )}

          {grouped.hiredAvailable.length > 0 && (
            <>
              <SectionTitle
                icon="🎒"
                title="روی نیمکت"
                sub="در باشگاه هستند و می‌توانند این‌جا کار را دست بگیرند"
              />
              {grouped.hiredAvailable.map(renderCard)}
            </>
          )}

          {grouped.unitSpecialists.length > 0 && (
            <>
              <SectionTitle
                icon="📋"
                title="بازار استخدام"
                sub={`نیروهای تخصصی برای ${def.name}`}
              />
              {grouped.unitSpecialists.map(renderCard)}
            </>
          )}

          {grouped.allRounders.length > 0 && (
            <>
              <SectionTitle
                icon="🌐"
                title="استعدادیاب‌های همه‌کاره"
                sub="روی هر ساختمان می‌نشینند و کار را راه می‌اندازند"
              />
              {grouped.allRounders.map(renderCard)}
            </>
          )}

          {list.length === 0 && (
            <p className="py-8 text-center text-sm text-white/45">
              هنوز مدیری برای این ساختمان تعریف نشده.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
