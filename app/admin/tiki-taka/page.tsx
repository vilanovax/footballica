import { Swords } from "lucide-react";
import Link from "next/link";
import { getAdminTikiTakaSnapshot } from "@/actions/admin/tikiTaka";
import { TikiTakaAdminPanel } from "@/components/admin/TikiTakaAdminPanel";
import { ModePlacementBadges } from "@/components/admin/ModePlacementBadges";
import { AdminHelpTip } from "@/components/admin/AdminHelpTip";

export const dynamic = "force-dynamic";

export default async function AdminTikiTakaPage() {
  const snapshot = await getAdminTikiTakaSnapshot();
  const turnSec = Math.round(snapshot.duelKnobs.tikiTakaTurnMs / 100) / 10;
  const preview = snapshot.preview;
  const depth =
    !preview
      ? "—"
      : preview.emptyCells > 0
        ? `${preview.emptyCells} empty`
        : preview.thinCells > 0
          ? `${preview.thinCells} thin`
          : "Deep";

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-12 -top-16 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl"
        />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-400/30">
                <Swords className="h-3 w-3" strokeWidth={2.5} />
                Claim board
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/85 ring-1 ring-white/15">
                تیکی‌تاکا
              </span>
            </div>
            <ModePlacementBadges placement={snapshot.placement} />
          </div>
          <h1 className="mt-2 flex items-center gap-1.5 text-2xl font-bold tracking-tight text-white">
            Tiki-Taka
            <AdminHelpTip
              wide
              title="تیکی‌تاکا"
              text="PvP 3×3 claim board. No daily puzzle bank — axes auto-build from Players when a duel special starts. Tune turn + placement in Controls; enrich catalog via Players."
            />
          </h1>
          <p className="mt-1 text-sm font-medium text-white/80">
            Axes from Players · turn {turnSec}s ·{" "}
            <Link
              href="/admin/players"
              className="font-semibold text-emerald-300 underline-offset-2 hover:underline"
            >
              Edit catalog
            </Link>
          </p>
          <div className="mt-3 grid max-w-lg grid-cols-3 gap-2">
            <HeroStat
              label="Players"
              value={String(snapshot.activePlayerPoolCount)}
            />
            <HeroStat
              label="Duel 7d"
              value={String(snapshot.recentTikiDuelRounds)}
            />
            <HeroStat label="Depth" value={depth} muted />
          </div>
        </div>
      </div>

      <TikiTakaAdminPanel snapshot={snapshot} />
    </div>
  );
}

function HeroStat({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-lg bg-white/5 px-2.5 py-1.5 ring-1 ring-white/10">
      <p
        className={[
          "text-sm font-bold tabular-nums",
          muted ? "text-white/85" : "text-white",
        ].join(" ")}
      >
        {value}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">
        {label}
      </p>
    </div>
  );
}
