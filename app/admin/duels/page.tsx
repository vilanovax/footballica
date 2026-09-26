import Link from "next/link";
import { Swords } from "lucide-react";
import { getDuelHealthReport } from "@/actions/admin/duelHealth";
import { AdminHelpTip } from "@/components/admin/AdminHelpTip";

export const dynamic = "force-dynamic";

function fmtHours(h: number | null): string {
  if (h == null || !Number.isFinite(h)) return "—";
  if (h < 1) return `${Math.round(h * 60)}m`;
  return `${h.toFixed(1)}h`;
}

export default async function AdminDuelsPage() {
  const report = await getDuelHealthReport(30);
  if ("error" in report) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        {report.error}
      </p>
    );
  }

  const r = report;

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-e-12 -top-16 h-40 w-40 rounded-full bg-rose-400/20 blur-3xl"
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-400/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-rose-200 ring-1 ring-rose-400/30">
              <Swords className="h-3 w-3" strokeWidth={2.5} />
              Draft Duel
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/85 ring-1 ring-white/15">
              Last {r.windowDays} days
            </span>
          </div>
          <h1 className="mt-2 flex items-center gap-1.5 text-2xl font-bold tracking-tight text-white">
            Duel health
            <AdminHelpTip text="Turn latency from round submit timestamps. Abandoners = humans who hit the turn timer (timeoutUserId). Tune turnHours + timeout action in Game Config → Duel." />
          </h1>
          <p className="mt-1 max-w-xl text-sm text-white/70">
            Live clock:{" "}
            <strong className="text-white">{r.turnHours}h</strong> · action{" "}
            <strong className="text-white">{r.timeoutAction}</strong>
            {" · "}
            <Link
              href="/admin/config"
              className="font-semibold text-emerald-300 underline-offset-2 hover:underline"
            >
              Edit in Game Config
            </Link>
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Avg attack→defend"
          value={fmtHours(r.avgHalfGapHours)}
          hint={`${r.sampleHalfGaps} halves`}
        />
        <Stat
          label="Avg between rounds"
          value={fmtHours(r.avgBetweenRoundsHours)}
          hint={`${r.sampleBetweenRounds} pairs`}
        />
        <Stat
          label="Timeout finishes"
          value={String(r.timeoutFinishes)}
          hint={`${r.abandonerCount} unique players`}
          tone="rose"
        />
        <Stat
          label="Open / overdue / stuck bot"
          value={`${r.activeOpen} / ${r.overdueHumanTurns} / ${r.stuckBotTurns}`}
          hint="Active · human past deadline · bot schedule broken"
          tone={
            r.overdueHumanTurns + r.stuckBotTurns > 0 ? "amber" : "default"
          }
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">
            Top abandoners
            <span className="ms-2 text-[11px] font-semibold text-slate-400">
              timed out most often
            </span>
          </h2>
        </div>
        {r.topAbandoners.length === 0 ? (
          <p className="text-sm text-slate-500">
            No timeout forfeits in this window.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {r.topAbandoners.map((row) => (
              <li
                key={row.userId}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {row.displayName}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {row.clubName ?? "No club"} · {row.userId.slice(0, 10)}…
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold tabular-nums text-rose-800 ring-1 ring-rose-100">
                  {row.timeouts}× timeout
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "rose" | "amber";
}) {
  const ring =
    tone === "rose"
      ? "border-rose-200 bg-rose-50/60"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50/60"
        : "border-slate-200 bg-white";
  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${ring}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-black tabular-nums text-slate-900">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[11px] font-medium text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
