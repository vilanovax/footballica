"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { GameCard } from "@/components/ui/GameCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useGame } from "@/lib/store";
import { faNum, faCount } from "@/lib/format";
import { leagueForXp } from "@/lib/player";
import { currentDivisionLabel } from "@/lib/promotion";
import { useClubAvatar } from "@/lib/clubAvatar";
import {
  arenaScore,
  buildLeaderboardRows,
  clubValue,
  leaderboardPointsLabel,
  leaderboardSubtitle,
  leaderboardTitle,
  type LeaderboardKind,
} from "@/lib/leaderboards";

interface Row {
  rank: number;
  name: string;
  short: string;
  points: number;
  color: string;
  you?: boolean;
  sublabel?: string;
}

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

type ZoneKind = "promo" | "safe" | "relegate";

function Zone({ label, kind }: { label: string; kind: ZoneKind }) {
  return (
    <div className={`lb-zone lb-zone--${kind}`} role="separator">
      <span className="lb-zone__line" aria-hidden />
      <span className="lb-zone__label">{label}</span>
      <span className="lb-zone__line" aria-hidden />
    </div>
  );
}

function rowVariant(rank: number, you?: boolean): string {
  if (you) return "lb-row--you";
  if (rank === 1) return "lb-row--gold";
  if (rank === 2) return "lb-row--silver";
  if (rank === 3) return "lb-row--bronze";
  return "";
}

function LeaderboardRow({
  row,
  crest,
  crestColor,
  pointsLabel,
}: {
  row: Row;
  crest: string;
  crestColor: string;
  pointsLabel: string;
}) {
  const variant = rowVariant(row.rank, row.you);
  const isPodium = row.rank <= 3 && !row.you;

  return (
    <div
      className={`lb-row ${variant}`}
      aria-current={row.you ? "true" : undefined}
    >
      <span
        className={`lb-rank ${MEDALS[row.rank] ? "lb-rank--medal" : ""}`}
        aria-label={`رتبه ${faNum(row.rank)}`}
      >
        {MEDALS[row.rank] ?? faNum(row.rank)}
      </span>

      <Avatar
        label={row.you ? crest : row.short}
        color={row.you ? crestColor : row.color}
        size={isPodium ? 50 : 46}
        crown={row.rank === 1}
        className="shrink-0"
      />

      <div className="lb-row__info min-w-0 flex-1">
        <p className="lb-row__name truncate">
          {row.name}
          {row.you && <span className="lb-you-badge">تو</span>}
        </p>
        {isPodium && (
          <p className="lb-row__sub">
            {row.rank === 1 ? "صدر جدول" : row.rank === 2 ? "نزدیک به قهرمانی" : "پلهٔ سوم"}
          </p>
        )}
        {row.sublabel && !isPodium && (
          <p className="lb-row__sub">{row.sublabel}</p>
        )}
      </div>

      <div className="lb-xp shrink-0 text-left">
        <span className={`lb-xp__value tabular-nums ${row.you ? "lb-xp__value--you" : ""}`}>
          {faCount(row.points)}
        </span>
        <span className="lb-xp__unit">{pointsLabel}</span>
      </div>
    </div>
  );
}

function LeaderboardTabs({
  active,
  onChange,
}: {
  active: LeaderboardKind;
  onChange: (tab: LeaderboardKind) => void;
}) {
  return (
    <div className="lb-tabs mx-5 mt-4 grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange("arena")}
        className={`lb-tabs__btn ${active === "arena" ? "lb-tabs__btn--active" : ""}`}
      >
        <span className="lb-tabs__title">جدول کوییز</span>
        <span className="lb-tabs__sub">skill و رقابت</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("club")}
        className={`lb-tabs__btn ${active === "club" ? "lb-tabs__btn--active" : ""}`}
      >
        <span className="lb-tabs__title">جدول باشگاه</span>
        <span className="lb-tabs__sub">کریر و اقتصاد</span>
      </button>
    </div>
  );
}

export function Leaderboard() {
  const club = useGame((s) => s.club);
  const xp = useGame((s) => s.xp);
  const totalCorrect = useGame((s) => s.totalCorrect);
  const matchesWon = useGame((s) => s.matchesWon);
  const bombBest = useGame((s) => s.bombBest);
  const survivalBest = useGame((s) => s.survivalBest);
  const streakDays = useGame((s) => s.streakDays);
  const arenaRating = useGame((s) => s.arenaRating);
  const fans = useGame((s) => s.fans);
  const budget = useGame((s) => s.budget);
  const vaultLevel = useGame((s) => s.vaultLevel);
  const seasonStep = useGame((s) => s.seasonStep);
  const playerFocus = useGame((s) => s.playerFocus);
  const clubAvatar = useClubAvatar();

  const [tab, setTab] = useState<LeaderboardKind>(
    playerFocus === "club" ? "club" : "arena",
  );

  const input = useMemo(
    () => ({
      xp,
      totalCorrect,
      matchesWon,
      bombBest,
      survivalBest,
      streakDays,
      arenaRating,
      fans,
      budget,
      vaultLevel,
      seasonStep,
      clubName: club.name,
    }),
    [
      xp,
      totalCorrect,
      matchesWon,
      bombBest,
      survivalBest,
      streakDays,
      arenaRating,
      fans,
      budget,
      vaultLevel,
      seasonStep,
      club.name,
    ],
  );

  const rows = useMemo(() => buildLeaderboardRows(tab, input), [tab, input]);
  const youRow = rows.find((r) => r.you);
  const promoCutoff = rows[2]?.points ?? 0;
  const pointsToPromo =
    youRow && youRow.rank > 3 ? Math.max(0, promoCutoff - youRow.points + 1) : 0;
  const rankProgress =
    youRow && promoCutoff > 0
      ? Math.max(8, Math.min(100, (youRow.points / promoCutoff) * 100))
      : 0;

  const youArenaScore = arenaScore(input);
  const youClubValue = clubValue(input);
  const league = leagueForXp(xp);
  const division = currentDivisionLabel(seasonStep);
  const pointsLabel = leaderboardPointsLabel(tab);

  const seasonState =
    tab === "arena"
      ? youRow && youRow.rank <= 3
        ? "تو همین حالا داخل منطقهٔ صعودی Arena هستی."
        : youRow && youRow.rank <= 7
          ? "فعلاً در منطقهٔ امنی؛ با چند برد بیشتر به صعود نزدیک می‌شوی."
          : "برای خروج از منطقهٔ خطر باید این هفته امتیاز Arena بیشتری جمع کنی."
      : youRow && youRow.rank <= 3
        ? "باشگاهت در صدر جدول فصلی است."
        : youRow && youRow.rank <= 7
          ? "باشگاه در مسیر خوبی است؛ با صعود و رشد اقتصاد بالاتر می‌روی."
          : "برای بالا آمدن در جدول باشگاه باید فصل و اقتصاد را جلو ببری.";

  return (
    <div className="leaderboard-screen pitch-stripes min-h-dvh pb-32" dir="rtl">
      <header className="lb-header px-5 pt-6 text-right">
        <h1 className="text-2xl font-extrabold text-white">رده‌بندی</h1>
        <p className="mt-1 text-sm text-white/50">{leaderboardSubtitle(tab)}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="lb-season-pill">
            {tab === "arena" ? "۳ روز تا پایان هفته" : "فصل فعال"}
          </span>
          <span className="lb-league-pill">
            {tab === "arena" ? league : division}
          </span>
        </div>
      </header>

      <LeaderboardTabs active={tab} onChange={setTab} />

      {youRow && (
        <GameCard variant="hero" className="lb-summary mx-5 mt-4 rounded-3xl p-4">
          <div className="lb-summary__top">
            <div className="lb-summary__copy">
              <p className="lb-summary__eyebrow">
                {tab === "arena" ? "وضعیت Arena تو" : "وضعیت باشگاه تو"}
              </p>
              <h2 className="lb-summary__title">
                رتبهٔ {faNum(youRow.rank)} از {faNum(rows.length)}
              </h2>
              <p className="lb-summary__sub">{seasonState}</p>
            </div>
            <div className="lb-summary__badge">
              <span className="lb-summary__badge-rank">{faNum(youRow.rank)}</span>
              <span className="lb-summary__badge-label">رتبه</span>
            </div>
          </div>

          <div className="lb-summary__stats">
            <div className="lb-summary__stat">
              <span className="lb-summary__stat-value">{faCount(youRow.points)}</span>
              <span className="lb-summary__stat-label">{pointsLabel}</span>
            </div>
            <div className="lb-summary__stat">
              <span className="lb-summary__stat-value">
                {pointsToPromo > 0 ? faCount(pointsToPromo) : faNum(0)}
              </span>
              <span className="lb-summary__stat-label">
                {pointsToPromo > 0 ? "تا صعود" : "داخل صعود"}
              </span>
            </div>
          </div>

          <div className="lb-summary__progress">
            <div className="lb-summary__progress-labels">
              <span>{tab === "arena" ? "منطقهٔ صعود" : "منطقهٔ رشد"}</span>
              <span>{pointsToPromo > 0 ? "نزدیک شو" : "رسیدی"}</span>
            </div>
            <ProgressBar
              value={rankProgress}
              max={100}
              tone="info"
              trackClassName="lb-summary__track h-2"
            />
          </div>

          <p className="lb-hint mt-3 text-[11px] font-bold text-white/45 text-right">
            {tab === "arena"
              ? `امتیاز Arena: ${faCount(youArenaScore)} · بدون مزیت اقتصادی باشگاه`
              : `ارزش باشگاه: ${faCount(youClubValue)} · ${division}`}
          </p>
        </GameCard>
      )}

      <div className="px-5 mt-3">
        <p className="text-[11px] font-bold text-white/40 text-right">
          {leaderboardTitle(tab)}
        </p>
      </div>

      <div className="px-5 mt-3 space-y-2.5">
        <Zone label={tab === "arena" ? "منطقهٔ صعود" : "منطقهٔ رشد"} kind="promo" />
        {rows.map((r, i) => (
          <div key={`${tab}-${r.rank}-${r.short}`}>
            <LeaderboardRow
              row={r}
              crest={clubAvatar.label}
              crestColor={clubAvatar.color}
              pointsLabel={pointsLabel}
            />
            {i === 2 && <Zone label="منطقهٔ امن" kind="safe" />}
            {i === 7 && <Zone label="منطقهٔ سقوط" kind="relegate" />}
          </div>
        ))}
      </div>
    </div>
  );
}
