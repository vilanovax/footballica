"use client";

import { Avatar } from "@/components/ui/Avatar";
import { GameCard } from "@/components/ui/GameCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useGame } from "@/lib/store";
import { faNum, faCount } from "@/lib/format";
import { leagueForXp } from "@/lib/player";

interface Row {
  rank: number;
  name: string;
  short: string;
  points: number;
  color: string;
  you?: boolean;
}

const BASE_ROWS: Omit<Row, "name" | "points" | "you">[] = [
  { rank: 1, short: "س.ک", color: "foe" },
  { rank: 2, short: "ز.ر", color: "#8b3fe0" },
  { rank: 3, short: "م.ا", color: "#e08a2f" },
  { rank: 4, short: "تو", color: "you" },
  { rank: 5, short: "ع.ن", color: "foe" },
  { rank: 6, short: "ن.ص", color: "#2f9e5f" },
  { rank: 7, short: "ر.ح", color: "foe" },
  { rank: 8, short: "س.م", color: "#8b3fe0" },
  { rank: 9, short: "ک.ر", color: "#2f9e5f" },
  { rank: 10, short: "ل.ک", color: "foe" },
];

const MOCK_NAMES = [
  "سینا کریمی",
  "زهرا رضایی",
  "مهدی احمدی",
  "",
  "علی نوری",
  "نگار صادقی",
  "رضا حریف",
  "سارا محمدی",
  "کیان رستمی",
  "لیلا کاظمی",
];

const MOCK_POINTS = [4820, 4510, 4180, 0, 3720, 3400, 3120, 2890, 2610, 2350];

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
}: {
  row: Row;
  crest: string;
  crestColor: string;
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
      </div>

      <div className="lb-xp shrink-0 text-left">
        <span className={`lb-xp__value tabular-nums ${row.you ? "lb-xp__value--you" : ""}`}>
          {faCount(row.points)}
        </span>
        <span className="lb-xp__unit">XP</span>
      </div>
    </div>
  );
}

export function Leaderboard() {
  const club = useGame((s) => s.club);
  const xp = useGame((s) => s.xp);
  const league = leagueForXp(xp);

  const rows: Row[] = BASE_ROWS.map((r, i) => ({
    ...r,
    name: i === 3 ? club.name : MOCK_NAMES[i],
    points: i === 3 ? xp : MOCK_POINTS[i],
    you: i === 3,
  }));

  const youRow = rows.find((r) => r.you);
  const promoCutoff = rows[2]?.points ?? 0;
  const xpToPromo =
    youRow && youRow.rank > 3 ? Math.max(0, promoCutoff - youRow.points + 1) : 0;
  const rankProgress =
    youRow && promoCutoff > 0 ? Math.max(8, Math.min(100, (youRow.points / promoCutoff) * 100)) : 0;
  const seasonState =
    youRow && youRow.rank <= 3
      ? "تو همین حالا داخل منطقهٔ صعودی هستی."
      : youRow && youRow.rank <= 7
        ? "فعلا در منطقهٔ امنی؛ با چند برد می‌توانی به صعود نزدیک شوی."
        : "برای خروج از منطقهٔ خطر باید این هفته بیشتر XP جمع کنی.";

  return (
    <div className="leaderboard-screen pitch-stripes min-h-dvh pb-32" dir="rtl">
      <header className="lb-header px-5 pt-6 text-right">
        <h1 className="text-2xl font-extrabold text-white">رده‌بندی هفتگی</h1>
        <p className="mt-1 text-sm text-white/50">
          هر برد و هر جواب درست، جایگاه باشگاهت را در جدول این هفته تغییر می‌دهد.
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="lb-season-pill">۳ روز تا پایان فصل</span>
          <span className="lb-league-pill">{league}</span>
        </div>
      </header>

      {youRow && (
        <GameCard variant="hero" className="lb-summary mx-5 mt-4 rounded-3xl p-4">
          <div className="lb-summary__top">
            <div className="lb-summary__copy">
              <p className="lb-summary__eyebrow">وضعیت باشگاه تو</p>
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
              <span className="lb-summary__stat-label">XP فعلی</span>
            </div>
            <div className="lb-summary__stat">
              <span className="lb-summary__stat-value">
                {xpToPromo > 0 ? faCount(xpToPromo) : faNum(0)}
              </span>
              <span className="lb-summary__stat-label">
                {xpToPromo > 0 ? "تا صعود" : "داخل صعود"}
              </span>
            </div>
          </div>

          <div className="lb-summary__progress">
            <div className="lb-summary__progress-labels">
              <span>منطقهٔ صعود</span>
              <span>{xpToPromo > 0 ? "نزدیک شو" : "رسیدی"}</span>
            </div>
            <ProgressBar
              value={rankProgress}
              max={100}
              tone="info"
              trackClassName="lb-summary__track h-2"
            />
          </div>
        </GameCard>
      )}

      <div className="px-5 mt-5 space-y-2.5">
        <Zone label="منطقهٔ صعود" kind="promo" />
        {rows.map((r, i) => (
          <div key={r.rank}>
            <LeaderboardRow row={r} crest={club.crest} crestColor={club.color} />
            {i === 2 && <Zone label="منطقهٔ امن" kind="safe" />}
            {i === 7 && <Zone label="منطقهٔ سقوط" kind="relegate" />}
          </div>
        ))}
      </div>
    </div>
  );
}
