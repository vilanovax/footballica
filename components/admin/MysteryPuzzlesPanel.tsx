"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarDays,
  Check,
  ChevronDown,
  History,
  Save,
  Search,
  Wand2,
} from "lucide-react";
import {
  ensureMysteryScheduleWeek,
  upsertDailyMysteryPuzzle,
  type AdminMysteryPuzzleRow,
} from "@/actions/admin/mystery";
import { AdminHelpTip, FieldLabel } from "@/components/admin/AdminHelpTip";
import { AdminJalaliDateField } from "@/components/admin/AdminJalaliDateField";
import { formatJalaliLabel } from "@/lib/admin/jalali";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PlayerOpt = {
  slug: string;
  nameEn: string;
  nameFa: string;
  isActive: boolean;
};

const WEEK_DAYS = 7;
const GUESS_PRESETS = [4, 5, 6, 8, 10];
/** Picking the same target inside this window gets a repeat warning. */
const REPEAT_WINDOW_DAYS = 30;

function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + n, 12)).toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000,
  );
}

const WEEKDAY_FA = new Intl.DateTimeFormat("fa-IR", {
  weekday: "short",
  timeZone: "UTC",
});

function weekdayFa(key: string): string {
  return WEEKDAY_FA.format(new Date(`${key}T12:00:00Z`));
}

/** "۱۴۰۵/۰۷/۰۵" → "۰۷/۰۵" for compact day tiles. */
function shortJalali(key: string): string {
  const parts = formatJalaliLabel(key).split("/");
  return parts.length === 3 ? `${parts[1]}/${parts[2]}` : key;
}

function solveRate(p: AdminMysteryPuzzleRow): string {
  if (!p.attemptCount) return "—";
  return `${Math.round((p.solvedCount / p.attemptCount) * 100)}%`;
}

export function MysteryPuzzlesPanel({
  todayKey,
  initialPuzzles,
  players,
}: {
  todayKey: string;
  initialPuzzles: AdminMysteryPuzzleRow[];
  players: PlayerOpt[];
}) {
  const router = useRouter();
  const [puzzles, setPuzzles] = useState(initialPuzzles);
  const byDate = useMemo(
    () => new Map(puzzles.map((p) => [p.dateKey, p])),
    [puzzles],
  );

  const seed = byDate.get(todayKey) ?? null;
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [playerId, setPlayerId] = useState(seed?.targetPlayerId ?? "");
  const [maxGuesses, setMaxGuesses] = useState(seed?.maxGuesses ?? 6);
  const [query, setQuery] = useState("");
  const [otherDate, setOtherDate] = useState(false);
  const [pending, startTransition] = useTransition();

  const weekKeys = useMemo(
    () => Array.from({ length: WEEK_DAYS }, (_, i) => addDays(todayKey, i)),
    [todayKey],
  );
  const weekEnd = weekKeys[weekKeys.length - 1]!;
  const weekSet = weekKeys.filter((k) => byDate.has(k)).length;

  const later = useMemo(
    () =>
      puzzles
        .filter((p) => p.dateKey > weekEnd)
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey)),
    [puzzles, weekEnd],
  );
  const past = useMemo(
    () =>
      puzzles
        .filter((p) => p.dateKey < todayKey)
        .sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
    [puzzles, todayKey],
  );

  const selected = byDate.get(selectedKey) ?? null;
  const isPast = selectedKey < todayKey;

  /** Nearest other day each player is scheduled on — drives repeat warnings. */
  const nearestUse = useMemo(() => {
    const map = new Map<string, { dateKey: string; gap: number }>();
    for (const p of puzzles) {
      if (p.dateKey === selectedKey) continue;
      const gap = Math.abs(daysBetween(selectedKey, p.dateKey));
      const prev = map.get(p.targetPlayerId);
      if (!prev || gap < prev.gap) {
        map.set(p.targetPlayerId, { dateKey: p.dateKey, gap });
      }
    }
    return map;
  }, [puzzles, selectedKey]);

  const activePlayers = useMemo(
    () => players.filter((p) => p.isActive),
    [players],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? activePlayers.filter(
          (p) =>
            p.nameEn.toLowerCase().includes(q) ||
            p.nameFa.includes(query.trim()) ||
            p.slug.includes(q),
        )
      : activePlayers;
    // Fresh picks first; recently used sink to the bottom.
    return [...list].sort((a, b) => {
      const ga = nearestUse.get(a.slug)?.gap ?? Infinity;
      const gb = nearestUse.get(b.slug)?.gap ?? Infinity;
      const ra = ga <= REPEAT_WINDOW_DAYS ? 1 : 0;
      const rb = gb <= REPEAT_WINDOW_DAYS ? 1 : 0;
      if (ra !== rb) return ra - rb;
      return a.nameEn.localeCompare(b.nameEn);
    });
  }, [activePlayers, query, nearestUse]);

  const pickedPlayer = players.find((p) => p.slug === playerId) ?? null;
  const pickedRepeat = playerId ? nearestUse.get(playerId) : undefined;
  const dirty =
    !selected ||
    selected.targetPlayerId !== playerId ||
    selected.maxGuesses !== maxGuesses;

  function selectDay(key: string) {
    const row = byDate.get(key) ?? null;
    setSelectedKey(key);
    setPlayerId(row?.targetPlayerId ?? "");
    setMaxGuesses(row?.maxGuesses ?? 6);
    setQuery("");
  }

  function publish() {
    if (!playerId) {
      toast.error("Pick a target player.");
      return;
    }
    startTransition(async () => {
      const res = await upsertDailyMysteryPuzzle({
        dateKey: selectedKey,
        targetPlayerId: playerId,
        maxGuesses,
      });
      if (!res.ok || !res.puzzle) {
        const msg = res.ok
          ? "Could not save."
          : res.error === "player_inactive"
            ? "Player is inactive."
            : res.error === "date_invalid"
              ? "Invalid date."
              : res.error === "player_not_found"
                ? "Player not found."
                : "Could not save puzzle.";
        toast.error(msg);
        return;
      }
      const saved = res.puzzle;
      setPuzzles((prev) => [
        saved,
        ...prev.filter((p) => p.dateKey !== saved.dateKey),
      ]);
      toast.success(
        saved.isToday
          ? "Today’s target is live"
          : `Saved for ${formatJalaliLabel(saved.dateKey)}`,
      );
      const nextEmpty = weekKeys.find(
        (k) => k !== saved.dateKey && !byDate.has(k),
      );
      if (nextEmpty) selectDay(nextEmpty);
      router.refresh();
    });
  }

  function fillWeek() {
    startTransition(async () => {
      const res = await ensureMysteryScheduleWeek(WEEK_DAYS);
      if (!res.ok) {
        toast.error("Could not fill the week.");
        return;
      }
      toast.success(
        res.created
          ? `Filled ${res.created} empty day(s)`
          : "Week already covered",
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {/* Week strip */}
      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Next 7 days
            </h2>
            <span
              className={[
                "rounded-md px-2 py-0.5 text-[10px] font-bold ring-1",
                weekSet === WEEK_DAYS
                  ? "bg-emerald-50 text-emerald-950 ring-emerald-200"
                  : "bg-amber-50 text-amber-950 ring-amber-200",
              ].join(" ")}
            >
              {weekSet}/{WEEK_DAYS} set
            </span>
            <AdminHelpTip text="Empty days auto-pick a target on first play. Pick a day to set or change its target — changing today applies to GotD instantly." />
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || weekSet === WEEK_DAYS}
            onClick={fillWeek}
            className="h-8 gap-1.5"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Auto-fill empty
          </Button>
        </header>

        <div className="grid grid-cols-4 gap-1.5 p-2.5 sm:grid-cols-7">
          {weekKeys.map((key) => {
            const row = byDate.get(key);
            const active = key === selectedKey;
            const isToday = key === todayKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectDay(key)}
                aria-pressed={active}
                className={[
                  "flex min-h-[4.5rem] flex-col items-start gap-0.5 rounded-lg px-2.5 py-2 text-start transition",
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : row
                      ? "bg-white ring-1 ring-slate-200 hover:ring-slate-300"
                      : "border border-dashed border-slate-300 bg-white hover:border-slate-400",
                ].join(" ")}
              >
                <span className="flex w-full items-center justify-between gap-1">
                  <span
                    className={[
                      "text-[11px] font-bold tabular-nums",
                      active ? "text-white" : "text-slate-900",
                    ].join(" ")}
                  >
                    {shortJalali(key)}
                  </span>
                  {isToday ? (
                    <span
                      className={[
                        "rounded px-1 text-[9px] font-black uppercase",
                        active
                          ? "bg-white/15 text-white"
                          : "bg-amber-100 text-amber-950",
                      ].join(" ")}
                    >
                      Today
                    </span>
                  ) : null}
                </span>
                <span
                  className={[
                    "text-[10px] font-semibold",
                    active ? "text-white/80" : "text-slate-700",
                  ].join(" ")}
                >
                  {weekdayFa(key)}
                </span>
                <span
                  className={[
                    "line-clamp-2 text-[12px] font-semibold leading-tight",
                    active
                      ? "text-white"
                      : row
                        ? "text-slate-900"
                        : "text-slate-700",
                  ].join(" ")}
                >
                  {row ? row.playerNameEn : "Auto pick"}
                </span>
              </button>
            );
          })}
        </div>

        {later.length ? (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 px-3.5 py-2">
            <span className="text-[11px] font-bold text-slate-700">Later</span>
            {later.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectDay(p.dateKey)}
                className={[
                  "rounded-md px-2 py-1 text-[11px] font-semibold ring-1 transition",
                  p.dateKey === selectedKey
                    ? "bg-slate-900 text-white ring-slate-900"
                    : "bg-white text-slate-800 ring-slate-200 hover:ring-slate-300",
                ].join(" ")}
              >
                <span dir="rtl">{shortJalali(p.dateKey)}</span> ·{" "}
                {p.playerNameEn}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {/* Editor */}
      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-800" />
            <h2 className="text-sm font-semibold text-slate-900" dir="rtl">
              {weekdayFa(selectedKey)} {formatJalaliLabel(selectedKey)}
            </h2>
            {selectedKey === todayKey ? (
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-950 ring-1 ring-amber-200">
                Live now
              </span>
            ) : null}
            <span
              className={[
                "rounded-md px-2 py-0.5 text-[10px] font-bold ring-1",
                selected
                  ? "bg-emerald-50 text-emerald-950 ring-emerald-200"
                  : "bg-white text-slate-800 ring-slate-200",
              ].join(" ")}
            >
              {selected ? "Scheduled" : "Auto pick"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOtherDate((v) => !v)}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-bold text-slate-800 ring-1 ring-slate-200 transition hover:ring-slate-300"
            aria-expanded={otherDate}
          >
            Other date
            <ChevronDown
              className={[
                "h-3 w-3 transition-transform",
                otherDate ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>
        </header>

        {otherDate ? (
          <div className="border-b border-slate-100 px-3.5 py-3 sm:max-w-xs">
            <FieldLabel>تاریخ شمسی</FieldLabel>
            <AdminJalaliDateField
              value={selectedKey}
              onChange={(key) => selectDay(key)}
              disabled={pending}
            />
          </div>
        ) : null}

        {isPast ? (
          <p className="px-3.5 py-6 text-center text-sm font-medium text-slate-800">
            Past days are read-only — pick today or a future date.
          </p>
        ) : (
          <div className="grid gap-3 p-3.5 lg:grid-cols-[minmax(0,1fr)_16rem]">
            {/* Player picker */}
            <div className="min-w-0">
              <FieldLabel>Target player</FieldLabel>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-700" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name · جستجو"
                  className="h-10 pl-9"
                />
              </div>
              <ul
                className="mt-1.5 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-lg ring-1 ring-slate-200"
                role="listbox"
                aria-label="Players"
              >
                {filtered.length === 0 ? (
                  <li className="px-3 py-6 text-center text-[12px] font-medium text-slate-800">
                    No active player matches
                  </li>
                ) : (
                  filtered.map((p) => {
                    const on = p.slug === playerId;
                    const use = nearestUse.get(p.slug);
                    const recent = use && use.gap <= REPEAT_WINDOW_DAYS;
                    return (
                      <li key={p.slug}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={on}
                          onClick={() => setPlayerId(p.slug)}
                          className={[
                            "flex min-h-11 w-full items-center gap-2 px-3 py-2 text-start transition",
                            on ? "bg-emerald-50" : "hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "min-w-0 flex-1 truncate text-[13px] font-semibold",
                              on ? "text-emerald-950" : "text-slate-900",
                            ].join(" ")}
                          >
                            {p.nameEn}
                            {p.nameFa && p.nameFa !== p.nameEn ? (
                              <span
                                className={[
                                  "ms-2 text-[12px] font-medium",
                                  on ? "text-emerald-900" : "text-slate-700",
                                ].join(" ")}
                              >
                                <bdi>{p.nameFa}</bdi>
                              </span>
                            ) : null}
                          </span>
                          {recent ? (
                            <span
                              className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-950 ring-1 ring-amber-200"
                              dir="rtl"
                            >
                              {shortJalali(use.dateKey)}
                            </span>
                          ) : null}
                          {on ? (
                            <Check className="h-4 w-4 shrink-0 text-emerald-800" />
                          ) : null}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            {/* Summary + save */}
            <div className="flex flex-col gap-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-800">
                  Target
                </p>
                <p className="mt-0.5 text-base font-bold text-slate-900">
                  {pickedPlayer ? pickedPlayer.nameEn : "Not picked"}
                </p>
                {pickedPlayer?.nameFa &&
                pickedPlayer.nameFa !== pickedPlayer.nameEn ? (
                  <p
                    className="text-[12px] font-medium text-slate-800"
                    dir="auto"
                  >
                    {pickedPlayer.nameFa}
                  </p>
                ) : null}
                {pickedRepeat && pickedRepeat.gap <= REPEAT_WINDOW_DAYS ? (
                  <p className="mt-1.5 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-950 ring-1 ring-amber-200">
                    Also used on{" "}
                    <span dir="rtl">
                      {formatJalaliLabel(pickedRepeat.dateKey)}
                    </span>
                  </p>
                ) : null}
              </div>

              <div>
                <FieldLabel>Max guesses</FieldLabel>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {GUESS_PRESETS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMaxGuesses(n)}
                      aria-pressed={maxGuesses === n}
                      className={[
                        "h-9 min-w-9 rounded-md px-2 text-[13px] font-bold tabular-nums ring-1 transition",
                        maxGuesses === n
                          ? "bg-slate-900 text-white ring-slate-900"
                          : "bg-white text-slate-900 ring-slate-200 hover:ring-slate-300",
                      ].join(" ")}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {selected ? (
                <p className="text-[11px] font-semibold text-slate-800">
                  {selected.attemptCount} plays · {selected.solvedCount} solved
                  · {solveRate(selected)}
                </p>
              ) : null}

              <Button
                type="button"
                disabled={pending || !playerId || !dirty}
                onClick={publish}
                className="mt-auto h-10 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500"
              >
                <Save className="h-3.5 w-3.5" />
                {pending
                  ? "Saving…"
                  : selected
                    ? dirty
                      ? "Update"
                      : "Saved"
                    : "Publish"}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* History */}
      <details className="group overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2.5">
          <span className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-800" />
            <span className="text-sm font-semibold text-slate-900">
              History
            </span>
            <span className="text-[11px] font-semibold text-slate-700">
              {past.length} day{past.length === 1 ? "" : "s"}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-slate-800 transition-transform group-open:rotate-180" />
        </summary>
        {past.length === 0 ? (
          <p className="border-t border-slate-100 px-3.5 py-6 text-center text-sm font-medium text-slate-800">
            No past puzzles yet
          </p>
        ) : (
          <table className="w-full border-t border-slate-100 text-[12px]">
            <thead>
              <tr className="text-start text-[10px] font-bold uppercase tracking-wide text-slate-700">
                <th className="px-3.5 py-2 text-start">Date</th>
                <th className="px-2 py-2 text-start">Player</th>
                <th className="px-2 py-2 text-end">Plays</th>
                <th className="px-3.5 py-2 text-end">Solve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {past.map((p) => (
                <tr key={p.id}>
                  <td
                    className="whitespace-nowrap px-3.5 py-2 font-bold text-slate-900"
                    dir="rtl"
                  >
                    {formatJalaliLabel(p.dateKey)}
                  </td>
                  <td className="max-w-0 truncate px-2 py-2 font-semibold text-slate-900">
                    {p.playerNameEn}
                  </td>
                  <td className="px-2 py-2 text-end font-semibold tabular-nums text-slate-800">
                    {p.attemptCount}
                  </td>
                  <td className="px-3.5 py-2 text-end font-semibold tabular-nums text-slate-800">
                    {solveRate(p)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </details>
    </div>
  );
}
