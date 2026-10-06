"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowUpRight,
  ContactRound,
  Grid3x3,
  LayoutGrid,
  RefreshCw,
  Save,
  Settings2,
  Swords,
} from "lucide-react";
import {
  getGameConfig,
  updateGameConfig,
} from "@/actions/admin/config";
import {
  refreshAdminTikiTakaPreview,
  type AdminTikiPreview,
  type AdminTikiTakaSnapshot,
} from "@/actions/admin/tikiTaka";
import { mergeGameConfig } from "@/lib/game/economy";
import { GRID_SIZE } from "@/lib/grid/types";
import { AdminHelpTip, FieldLabel } from "@/components/admin/AdminHelpTip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function msToSec(ms: number): number {
  return Math.round(ms / 100) / 10;
}

function secToMs(sec: number): number {
  return Math.round(sec * 1000);
}

function slugLabel(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type BoardHealth = "deep" | "thin" | "broken" | "none";

function boardHealth(preview: AdminTikiPreview | null): BoardHealth {
  if (!preview) return "none";
  if (preview.emptyCells > 0) return "broken";
  if (preview.thinCells > 0) return "thin";
  return "deep";
}

const HEALTH_TITLE: Record<BoardHealth, string> = {
  deep: "Deep",
  thin: "Thin",
  broken: "Broken",
  none: "—",
};

export function TikiTakaAdminPanel({
  snapshot,
}: {
  snapshot: AdminTikiTakaSnapshot;
}) {
  const router = useRouter();
  const [turnSec, setTurnSec] = useState(
    msToSec(snapshot.duelKnobs.tikiTakaTurnMs),
  );
  const [savedTurnSec, setSavedTurnSec] = useState(
    msToSec(snapshot.duelKnobs.tikiTakaTurnMs),
  );
  const [placement, setPlacement] = useState(snapshot.placement);
  const [placementSaved, setPlacementSaved] = useState(snapshot.placement);
  const [poolCount, setPoolCount] = useState(snapshot.activePlayerPoolCount);
  const [preview, setPreview] = useState<AdminTikiPreview | null>(
    snapshot.preview,
  );
  const [pending, startTransition] = useTransition();
  const [refreshing, startRefresh] = useTransition();

  const dirtyTurn = turnSec !== savedTurnSec;
  const dirtyPlacement =
    placement.duel !== placementSaved.duel ||
    placement.gotd !== placementSaved.gotd;
  const dirty = dirtyTurn || dirtyPlacement;

  const health = boardHealth(preview);

  const depthLabel = useMemo(() => {
    if (!preview) return null;
    if (health === "broken") return `${preview.emptyCells} empty`;
    if (health === "thin") return `${preview.thinCells} thin`;
    return "all ≥ 3";
  }, [preview, health]);

  function saveAll() {
    startTransition(async () => {
      const current = await getGameConfig();
      const next = mergeGameConfig({
        ...current,
        duel: {
          ...current.duel,
          tikiTakaTurnMs: secToMs(turnSec),
        },
        liveModes: {
          ...current.liveModes,
          tikiTaka: { ...placement },
        },
      });
      const res = await updateGameConfig(next);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const nextTurn = msToSec(res.config.duel.tikiTakaTurnMs);
      const nextPlacement = res.config.liveModes.tikiTaka;
      setTurnSec(nextTurn);
      setSavedTurnSec(nextTurn);
      setPlacement(nextPlacement);
      setPlacementSaved(nextPlacement);
      toast.success("Tiki-Taka saved");
      router.refresh();
    });
  }

  function refreshPreview() {
    startRefresh(async () => {
      const res = await refreshAdminTikiTakaPreview();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setPreview(res.preview);
      setPoolCount(res.activePlayerPoolCount);
      const h = boardHealth(res.preview);
      if (h === "deep") toast.success("Preview deep — all cells ≥ 3");
      else if (h === "thin")
        toast.message(
          `Thin catalog — ${res.preview.thinCells} cell(s) with 1–2 matches`,
        );
      else
        toast.error(
          `${res.preview.emptyCells} empty cell(s) — enrich Players`,
        );
    });
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(17rem,0.85fr)] lg:items-start">
      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Next special board
            </h2>
            <AdminHelpTip
              wide
              text="Same axis builder duel specials use at round start. Green ≥ 3 matches, amber 1–2, red empty. Hover a cell for sample footballers."
            />
            <span
              className={[
                "rounded-md px-2 py-0.5 text-[10px] font-bold ring-1",
                health === "deep"
                  ? "bg-emerald-50 text-emerald-950 ring-emerald-200"
                  : health === "thin"
                    ? "bg-amber-50 text-amber-950 ring-amber-200"
                    : health === "broken"
                      ? "bg-rose-50 text-rose-950 ring-rose-200"
                      : "bg-white text-slate-800 ring-slate-200",
              ].join(" ")}
            >
              {HEALTH_TITLE[health]}
              {depthLabel ? ` · ${depthLabel}` : ""}
            </span>
            {preview ? (
              <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-800 ring-1 ring-slate-200">
                {preview.source === "auto" ? "Immortal axes" : "Fallback"}
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={refreshing}
            onClick={refreshPreview}
            className="h-8 gap-1.5"
          >
            <RefreshCw
              className={[
                "h-3.5 w-3.5",
                refreshing ? "animate-spin" : "",
              ].join(" ")}
            />
            {refreshing ? "…" : "Refresh"}
          </Button>
        </header>

        {preview ? (
          <div className="space-y-3 p-3.5">
            {health === "thin" ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-950 ring-1 ring-amber-200">
                Catalog is thin — add career clubs / leagues so cells have more
                than one match.{" "}
                <Link
                  href="/admin/players"
                  className="font-bold underline-offset-2 hover:underline"
                >
                  Open Players
                </Link>
              </p>
            ) : null}
            {health === "broken" ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-950 ring-1 ring-rose-200">
                {preview.emptyCells} empty cell(s). Enrich the Players catalog
                before this special goes live.
              </p>
            ) : null}

            <div
              className="mx-auto grid w-full max-w-xl gap-1.5"
              style={{
                gridTemplateColumns: `minmax(5rem, 1.15fr) repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              }}
            >
              <div className="flex items-end justify-center pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-800">
                  3×3
                </span>
              </div>
              {preview.cols.map((axis) => (
                <AxisBadge key={axis.id} axis={axis} />
              ))}

              {preview.rows.map((rowAxis, r) => (
                <div key={rowAxis.id} className="contents">
                  <AxisBadge axis={rowAxis} />
                  {preview.cols.map((_, c) => {
                    const idx = r * GRID_SIZE + c;
                    const n = preview.cellCounts[idx] ?? 0;
                    const samples = preview.sampleSlugs[idx] ?? [];
                    const sample = samples[0] ? slugLabel(samples[0]) : null;
                    const tone =
                      n === 0
                        ? "border-rose-200 bg-rose-50 text-rose-950"
                        : n < 3
                          ? "border-amber-200 bg-amber-50 text-amber-950"
                          : "border-emerald-200 bg-emerald-50 text-emerald-950";
                    return (
                      <div
                        key={`cell-${r}-${c}`}
                        className={[
                          "flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 rounded-lg border-2 px-1 py-1.5",
                          tone,
                        ].join(" ")}
                        title={
                          samples.length
                            ? `${n} match(es) · ${samples.map(slugLabel).join(", ")}`
                            : `${n} matching player(s)`
                        }
                      >
                        <span className="text-sm font-bold tabular-nums leading-none">
                          {n}
                        </span>
                        {sample ? (
                          <span className="line-clamp-1 max-w-full text-[9px] font-semibold leading-tight">
                            {sample}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-800">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />≥ 3
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  1–2
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />0
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-800">
                min {preview.minCount} · pool {poolCount}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-3.5 py-10 text-center">
            <p className="text-sm font-medium text-slate-800">
              No preview yet
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-3 gap-1.5"
              disabled={refreshing}
              onClick={refreshPreview}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Build preview
            </Button>
          </div>
        )}
      </section>

      <div className="space-y-3">
        <section
          className={[
            "overflow-hidden rounded-xl border bg-white shadow-sm",
            dirty ? "border-amber-300" : "border-slate-200/90",
          ].join(" ")}
        >
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Controls</h2>
              {dirty ? (
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-950 ring-1 ring-amber-200">
                  Unsaved
                </span>
              ) : (
                <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-800 ring-1 ring-slate-200">
                  Saved
                </span>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              disabled={pending || !dirty}
              onClick={saveAll}
              className={[
                "h-8 gap-1.5",
                dirty
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : "",
              ].join(" ")}
            >
              <Save className="h-3.5 w-3.5" />
              {pending ? "…" : "Save"}
            </Button>
          </header>

          <div className="space-y-3 p-3.5">
            <div>
              <FieldLabel>Placement</FieldLabel>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <PlacementSwitch
                  label="Duel"
                  on={placement.duel}
                  disabled={pending}
                  onClick={() =>
                    setPlacement((p) => ({ ...p, duel: !p.duel }))
                  }
                />
                <PlacementSwitch
                  label="GotD"
                  on={placement.gotd}
                  disabled={pending}
                  onClick={() =>
                    setPlacement((p) => ({ ...p, gotd: !p.gotd }))
                  }
                />
              </div>
              <p className="mt-1.5 text-[11px] font-medium text-slate-800">
                Where this engine appears
              </p>
            </div>

            <div>
              <FieldLabel>Turn (sec)</FieldLabel>
              <Input
                type="number"
                min={5}
                step={0.5}
                value={turnSec}
                onChange={(e) => setTurnSec(Number(e.target.value))}
                className="mt-1.5 h-10"
              />
              <p className="mt-1 text-[11px] font-medium text-slate-800">
                Mini-turn claim window · min 5s
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-800">
            Content
          </p>
          <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-800">
            No question list — axes come from the{" "}
            <span className="font-semibold text-slate-900">Players</span>{" "}
            catalog at duel start (same engine as Immortal Grid).
          </p>
          <div className="mt-3 flex flex-col gap-1.5">
            <RailLink
              href="/admin/players"
              icon={ContactRound}
              label="Edit Players"
              hint="Shape axes"
            />
            <RailLink
              href="/admin/grid"
              icon={Grid3x3}
              label="Grid Day"
              hint="Shared Immortal engine"
            />
            <RailLink
              href="/admin/modes"
              icon={LayoutGrid}
              label="All Modes"
              hint="Placement map"
            />
            <RailLink
              href="/admin/config"
              icon={Settings2}
              label="Game Config"
              hint="Duel · Mini-games"
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200/90 bg-white px-3.5 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Swords className="h-3.5 w-3.5 text-slate-800" />
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-800">
              Duel (7d)
            </p>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
            {snapshot.recentTikiDuelRounds}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-800">
            Specials played this week
          </p>
        </section>
      </div>
    </div>
  );
}

function PlacementSwitch({
  label,
  on,
  disabled,
  onClick,
}: {
  label: string;
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={on}
      className={[
        "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 transition",
        on
          ? "bg-emerald-50 ring-1 ring-emerald-200"
          : "bg-white ring-1 ring-slate-200 hover:ring-slate-300",
        "disabled:opacity-50",
      ].join(" ")}
    >
      <span
        className={[
          "text-[11px] font-bold uppercase tracking-wide",
          on ? "text-emerald-950" : "text-slate-800",
        ].join(" ")}
      >
        {label}
      </span>
      <span
        className={[
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          on ? "bg-emerald-600" : "bg-slate-300",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
            on ? "translate-x-4" : "translate-x-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

function RailLink({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: typeof ContactRound;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 ring-1 ring-slate-200 transition hover:bg-emerald-50 hover:ring-emerald-200"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-bold text-slate-900">
          {label}
        </span>
        <span className="block text-[10px] font-medium text-slate-800">
          {hint}
        </span>
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-emerald-900" />
    </Link>
  );
}

function AxisBadge({
  axis,
}: {
  axis: { labelEn: string; labelFa: string; kind: string; value: string };
}) {
  return (
    <div
      className="flex min-h-12 flex-col items-center justify-center rounded-lg bg-slate-100 px-1 py-1.5 text-center ring-1 ring-slate-200"
      title={`${axis.kind}: ${axis.value}`}
    >
      <span className="line-clamp-2 text-[11px] font-bold leading-tight text-slate-900">
        {axis.labelEn}
      </span>
      <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-800">
        {axis.kind}
      </span>
    </div>
  );
}
