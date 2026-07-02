"use client";

import { useState } from "react";
import { useGame } from "@/lib/store";
import { faMoney, faNum } from "@/lib/format";
import { managersFor, RARITY_COLOR } from "@/lib/managers";
import { unitDef } from "@/lib/units";
import { ManagerAvatar } from "@/components/ui/ManagerAvatar";

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

  function shake(id: string) {
    setShakeId(id);
    setTimeout(() => setShakeId(null), 400);
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
        <div className="mb-4 flex items-center justify-between">
          <button onClick={onClose} className="text-sm font-bold text-white/50">
            بستن
          </button>
          <h3 className="text-lg font-extrabold">
            مدیرِ {def.name} {def.emoji}
          </h3>
        </div>

        <div className="space-y-3">
          {list.map((m) => {
            const isHired = Boolean(hired[m.id]);
            const assignedHere = assign[unitId] === m.id;
            const canHire = !isHired && budget >= m.cost;
            const rc = RARITY_COLOR[m.rarity];

            return (
              <div
                key={m.id}
                className={`rounded-2xl bg-white/5 p-3 flex items-center gap-3 ${
                  assignedHere ? "ring-2 ring-grass-400/60" : ""
                } ${shakeId === m.id ? "animate-shake" : ""}`}
              >
                <ManagerAvatar img={m.img} emoji={m.emoji} color={rc} size={54} />
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                      style={{ background: `${rc}33`, color: rc }}
                    >
                      {m.rarity}
                    </span>
                    <p className="font-extrabold">{m.name}</p>
                  </div>
                  <p className="mt-1 text-xs text-white/60">
                    💰 درآمد ×{faNum(m.incomeMult.toFixed(2).replace(".", "٫"))} ·
                    ⚡ سرعت +{faNum(Math.round((m.speedMult - 1) * 100))}٪
                    {m.target === "all" && " · همه‌کاره"}
                  </p>
                </div>

                {assignedHere ? (
                  <button
                    onClick={() => unassignUnit(unitId)}
                    className="shrink-0 rounded-xl bg-grass-500/20 px-3 py-2 text-xs font-extrabold text-grass-400"
                  >
                    منصوب ✓
                  </button>
                ) : isHired ? (
                  <button
                    onClick={() => {
                      if (assignManager(unitId, m.id) !== "ok") shake(m.id);
                    }}
                    className="shrink-0 rounded-xl bg-team-you px-3 py-2 text-xs font-extrabold text-white"
                  >
                    انتصاب
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (hireManager(m.id) !== "ok") shake(m.id);
                    }}
                    className={`shrink-0 rounded-xl px-3 py-2 text-xs font-extrabold ${
                      canHire ? "btn-gold" : "bg-white/8 text-white/35"
                    }`}
                  >
                    استخدام
                    <br />
                    {faMoney(m.cost)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
