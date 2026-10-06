import { Search } from "lucide-react";
import Link from "next/link";
import { listAdminMysteryPuzzles } from "@/actions/admin/mystery";
import { getGameConfig } from "@/actions/admin/config";
import { MysteryPuzzlesPanel } from "@/components/admin/MysteryPuzzlesPanel";
import { ModePlacementBadges } from "@/components/admin/ModePlacementBadges";
import { AdminHelpTip } from "@/components/admin/AdminHelpTip";
import { liveModesFromConfig } from "@/lib/game/liveModes";
import { formatJalaliLabel } from "@/lib/admin/jalali";

export const dynamic = "force-dynamic";

function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + n, 12)).toISOString().slice(0, 10);
}

export default async function AdminMysteryPage() {
  const [{ todayKey, puzzles, players }, config] = await Promise.all([
    listAdminMysteryPuzzles(),
    getGameConfig(),
  ]);
  const placement = liveModesFromConfig(config).mystery;
  const today = puzzles.find((p) => p.dateKey === todayKey) ?? null;
  const weekEnd = addDays(todayKey, 6);
  const weekSet = puzzles.filter(
    (p) => p.dateKey >= todayKey && p.dateKey <= weekEnd,
  ).length;
  const solve =
    today && today.attemptCount
      ? `${Math.round((today.solvedCount / today.attemptCount) * 100)}%`
      : "—";

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-12 -top-16 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
                <Search className="h-5 w-5 text-violet-300" strokeWidth={2.5} />
                Mystery Player
                <AdminHelpTip
                  wide
                  title="بازیکن مرموز"
                  text="یک هدف برای هر روز تهران. روزهای خالی هنگام اولین بازی خودکار انتخاب می‌شوند. تغییر هدف امروز فوراً روی GotD اعمال می‌شود."
                />
              </h1>
              <ModePlacementBadges placement={placement} />
            </div>
            <p className="mt-1 text-sm font-medium text-white/80">
              <span dir="rtl">امروز {formatJalaliLabel(todayKey)}</span>
              {" · "}
              {today ? today.playerNameEn : "Auto pick"}
              {" · "}
              <Link
                href="/admin/players"
                className="font-semibold text-violet-300 underline-offset-2 hover:underline"
              >
                Players
              </Link>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <HeroStat label="Plays today" value={String(today?.attemptCount ?? 0)} />
            <HeroStat label="Solve rate" value={solve} />
            <HeroStat label="Week set" value={`${weekSet}/7`} />
          </div>
        </div>
      </div>

      <MysteryPuzzlesPanel
        todayKey={todayKey}
        initialPuzzles={puzzles}
        players={players}
      />
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[5.5rem] rounded-lg bg-white/5 px-2.5 py-1.5 ring-1 ring-white/10">
      <p className="text-sm font-bold tabular-nums text-white">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">
        {label}
      </p>
    </div>
  );
}
