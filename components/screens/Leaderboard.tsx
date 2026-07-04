"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
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
  type PlayerLeaderboardKind,
} from "@/lib/leaderboards";
import {
  buildCityLeaderboardRows,
  buildFandomLeaderboardRows,
  communityIdentityLabel,
  isCommunityLeaderboard,
  leaderboardPointsLabel,
  leaderboardSubtitle,
  leaderboardTitle,
  type CommunityLeaderboardRow,
  type LeaderboardKind,
} from "@/lib/communityLeaderboards";

interface PlayerRow {
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
  row: PlayerRow;
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

function CommunityLeaderboardRow({
  row,
  pointsLabel,
}: {
  row: CommunityLeaderboardRow;
  pointsLabel: string;
}) {
  const variant = rowVariant(row.rank, row.you);

  return (
    <div
      className={`lb-row lb-row--community ${variant}`}
      aria-current={row.you ? "true" : undefined}
    >
      <span
        className={`lb-rank ${MEDALS[row.rank] ? "lb-rank--medal" : ""}`}
        aria-label={`رتبه ${faNum(row.rank)}`}
      >
        {MEDALS[row.rank] ?? faNum(row.rank)}
      </span>

      <div className="lb-community-avatar shrink-0" aria-hidden>
        {row.emoji}
      </div>

      <div className="lb-row__info min-w-0 flex-1">
        <p className="lb-row__name truncate">
          {row.name}
          {row.you && <span className="lb-you-badge">شهر/تیم تو</span>}
        </p>
        <p className="lb-row__sub">{faNum(row.members)} بازیکن فعال</p>
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

const TAB_OPTIONS: {
  id: LeaderboardKind;
  title: string;
  sub: string;
}[] = [
  { id: "arena", title: "کوییز", sub: "skill" },
  { id: "club", title: "باشگاه", sub: "کریر" },
  { id: "city", title: "شهرها", sub: "رقابت شهری" },
  { id: "fandom", title: "تیم‌ها", sub: "هواداری" },
];

function LeaderboardTabs({
  active,
  onChange,
}: {
  active: LeaderboardKind;
  onChange: (tab: LeaderboardKind) => void;
}) {
  return (
    <div className="lb-tabs lb-tabs--quad mx-5 mt-4 grid grid-cols-2 gap-2">
      {TAB_OPTIONS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`lb-tabs__btn ${active === tab.id ? "lb-tabs__btn--active" : ""}`}
        >
          <span className="lb-tabs__title">{tab.title}</span>
          <span className="lb-tabs__sub">{tab.sub}</span>
        </button>
      ))}
    </div>
  );
}

type ArenaView = "weekly" | "fairplay";

function ArenaModeToggle({
  active,
  onChange,
}: {
  active: ArenaView;
  onChange: (view: ArenaView) => void;
}) {
  return (
    <div className="lb-arena-mode mx-5 mt-3 flex gap-2">
      <button
        type="button"
        onClick={() => onChange("weekly")}
        className={`lb-arena-mode__btn ${active === "weekly" ? "lb-arena-mode__btn--active" : ""}`}
      >
        هفتگی
      </button>
      <button
        type="button"
        onClick={() => onChange("fairplay")}
        className={`lb-arena-mode__btn ${active === "fairplay" ? "lb-arena-mode__btn--active" : ""}`}
      >
        Fair Play
      </button>
    </div>
  );
}
function defaultTab(playerFocus: string): LeaderboardKind {
  if (playerFocus === "club") return "club";
  return "arena";
}

interface LeaderboardProps {
  onOpenProfile?: () => void;
  initialTab?: LeaderboardKind;
  initialArenaView?: ArenaView;
}

export function Leaderboard({
  onOpenProfile,
  initialTab,
  initialArenaView,
}: LeaderboardProps) {
  const club = useGame((s) => s.club);
  const xp = useGame((s) => s.xp);
  const totalCorrect = useGame((s) => s.totalCorrect);
  const matchesWon = useGame((s) => s.matchesWon);
  const bombBest = useGame((s) => s.bombBest);
  const survivalBest = useGame((s) => s.survivalBest);
  const streakDays = useGame((s) => s.streakDays);
  const arenaRating = useGame((s) => s.arenaRating);
  const rankedWins = useGame((s) => s.rankedWins);
  const rankedLosses = useGame((s) => s.rankedLosses);
  const fans = useGame((s) => s.fans);
  const budget = useGame((s) => s.budget);
  const vaultLevel = useGame((s) => s.vaultLevel);
  const seasonStep = useGame((s) => s.seasonStep);
  const playerFocus = useGame((s) => s.playerFocus);
  const clubAvatar = useClubAvatar();

  const [tab, setTab] = useState<LeaderboardKind>(
    () => initialTab ?? defaultTab(playerFocus),
  );
  const [arenaView, setArenaView] = useState<ArenaView>(initialArenaView ?? "weekly");

  const playerKind: PlayerLeaderboardKind =
    tab === "club" ? "club" : arenaView === "fairplay" ? "fairplay" : "arena";
  const isFairPlay = tab === "arena" && arenaView === "fairplay";

  const input = useMemo(
    () => ({
      xp,
      totalCorrect,
      matchesWon,
      bombBest,
      survivalBest,
      streakDays,
      arenaRating,
      rankedWins,
      rankedLosses,
      fans,
      budget,
      vaultLevel,
      seasonStep,
      clubName: club.name,
      cityId: club.city,
      heartTeamId: club.heartTeam,
    }),
    [
      xp,
      totalCorrect,
      matchesWon,
      bombBest,
      survivalBest,
      streakDays,
      arenaRating,
      rankedWins,
      rankedLosses,
      fans,
      budget,
      vaultLevel,
      seasonStep,
      club.name,
      club.city,
      club.heartTeam,
    ],
  );

  const playerRows = useMemo(
    () =>
      isCommunityLeaderboard(tab)
        ? []
        : buildLeaderboardRows(playerKind, input),
    [tab, playerKind, input],
  );

  const communityRows = useMemo(() => {
    if (tab === "city") return buildCityLeaderboardRows(input);
    if (tab === "fandom") return buildFandomLeaderboardRows(input);
    return [];
  }, [tab, input]);

  const rows = isCommunityLeaderboard(tab) ? communityRows : playerRows;
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
  const pointsLabel = isFairPlay ? "امتیاز Fair Play" : leaderboardPointsLabel(tab);
  const communityIdentity = isCommunityLeaderboard(tab)
    ? communityIdentityLabel(tab, club.city, club.heartTeam)
    : null;
  const needsIdentity = isCommunityLeaderboard(tab) && !communityIdentity;

  const seasonState = (() => {
    if (tab === "city") {
      if (!communityIdentity) {
        return "شهر باشگاهت را در پروفایل ثبت کن تا در جدول شهری دیده شوی.";
      }
      return youRow && youRow.rank <= 3
        ? "شهرت در صدر رقابت شهری است."
        : "با بازی بیشتر در Arena به شهرت کمک می‌کنی.";
    }
    if (tab === "fandom") {
      if (!communityIdentity) {
        return "تیم قلبی‌ات را در پروفایل انتخاب کن تا در جدول هواداری دیده شوی.";
      }
      return youRow && youRow.rank <= 3
        ? "تیم محبوبت در جمع برترین‌هاست."
        : "پیشرفت باشگاهت به قدرت تیم محبوبت اضافه می‌شود.";
    }
    if (tab === "arena") {
      if (isFairPlay && rankedWins + rankedLosses === 0) {
        return "هنوز دوئل رنکد نزدی؛ برای ورود به جدول Fair Play یک رنکد بزن.";
      }
      if (isFairPlay) {
        return youRow && youRow.rank <= 3
          ? "در جدول skill-first هستی — بدون کمک و بدون پاورآپ."
          : "با برد در دوئل رنکد امتیاز Fair Play بالاتر می‌رود.";
      }
      return youRow && youRow.rank <= 3
        ? "تو همین حالا داخل منطقهٔ صعودی Arena هستی."
        : youRow && youRow.rank <= 7
          ? "فعلاً در منطقهٔ امنی؛ با چند برد بیشتر به صعود نزدیک می‌شوی."
          : "برای خروج از منطقهٔ خطر باید این هفته امتیاز Arena بیشتری جمع کنی.";
    }
    return youRow && youRow.rank <= 3
      ? "باشگاهت در صدر جدول فصلی است."
      : youRow && youRow.rank <= 7
        ? "باشگاه در مسیر خوبی است؛ با صعود و رشد اقتصاد بالاتر می‌روی."
        : "برای بالا آمدن در جدول باشگاه باید فصل و اقتصاد را جلو ببری.";
  })();

  const headerPill =
    tab === "arena"
      ? isFairPlay
        ? "رنکد هفتگی"
        : "۳ روز تا پایان هفته"
      : tab === "club"
        ? "فصل فعال"
        : tab === "city"
          ? "لیگ شهرها"
          : "لیگ هواداری";

  const headerBadge =
    tab === "arena"
      ? isFairPlay
        ? `رتبه ${faNum(arenaRating)}`
        : league
      : tab === "club"
        ? division
        : communityIdentity ?? "ثبت نشده";

  return (
    <div className="leaderboard-screen pitch-stripes min-h-dvh pb-32" dir="rtl">
      <header className="lb-header px-5 pt-6 text-right">
        <h1 className="text-2xl font-extrabold text-white">رده‌بندی</h1>
        <p className="mt-1 text-sm text-white/50">
          {isFairPlay
            ? "فقط دوئل رنکد — بدون پاورآپ و بدون مزیت اقتصادی باشگاه."
            : leaderboardSubtitle(tab)}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="lb-season-pill">{headerPill}</span>
          <span className="lb-league-pill">{headerBadge}</span>
        </div>
      </header>

      <LeaderboardTabs active={tab} onChange={setTab} />

      {tab === "arena" && (
        <ArenaModeToggle active={arenaView} onChange={setArenaView} />
      )}

      {needsIdentity && (
        <GameCard variant="asset" className="lb-identity-cta mx-5 mt-4 rounded-2xl p-4 text-right">
          <p className="lb-identity-cta__title">
            {tab === "city" ? "شهر باشگاهت را ثبت کن" : "تیم قلبی‌ات را انتخاب کن"}
          </p>
          <p className="lb-identity-cta__sub">
            از پروفایل می‌توانی هویت باشگاه را تکمیل کنی و در جدول جامعه دیده شوی.
          </p>
          {onOpenProfile && (
            <Button
              onClick={onOpenProfile}
              variant="primary"
              size="sm"
              className="lb-identity-cta__btn mt-3"
            >
              {tab === "city" ? "ثبت شهر در پروفایل" : "انتخاب تیم در پروفایل"}
            </Button>
          )}
        </GameCard>
      )}

      {youRow && (
        <GameCard variant="hero" className="lb-summary mx-5 mt-4 rounded-3xl p-4">
          <div className="lb-summary__top">
            <div className="lb-summary__copy">
              <p className="lb-summary__eyebrow">
                {tab === "arena"
                  ? isFairPlay
                    ? "وضعیت Fair Play تو"
                    : "وضعیت Arena تو"
                  : tab === "club"
                    ? "وضعیت باشگاه تو"
                    : tab === "city"
                      ? "وضعیت شهر تو"
                      : "وضعیت تیم محبوب تو"}
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
              <span>
                {tab === "arena" || tab === "city" ? "منطقهٔ صعود" : "منطقهٔ رشد"}
              </span>
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
              ? isFairPlay
                ? `رتبه Arena: ${faNum(arenaRating)} · ${faNum(rankedWins)} برد / ${faNum(rankedLosses)} باخت رنکد`
                : `امتیاز Arena: ${faCount(youArenaScore)} · بدون مزیت اقتصادی باشگاه`
              : tab === "club"
                ? `ارزش باشگاه: ${faCount(youClubValue)} · ${division}`
                : tab === "city"
                  ? `شهر: ${communityIdentity ?? "ثبت نشده"} · سهم تو از Arena`
                  : `تیم: ${communityIdentity ?? "ثبت نشده"} · سهم تو از باشگاه`}
          </p>
        </GameCard>
      )}

      <div className="px-5 mt-3">
        <p className="text-[11px] font-bold text-white/40 text-right">
          {isFairPlay ? "جدول Fair Play هفتگی" : leaderboardTitle(tab)}
        </p>
      </div>

      <div className="px-5 mt-3 space-y-2.5">
        <Zone
          label={tab === "arena" || tab === "city" ? "منطقهٔ صعود" : "منطقهٔ رشد"}
          kind="promo"
        />
        {isCommunityLeaderboard(tab)
          ? communityRows.map((r, i) => (
              <div key={`${tab}-${r.id}`}>
                <CommunityLeaderboardRow row={r} pointsLabel={pointsLabel} />
                {i === 2 && <Zone label="منطقهٔ امن" kind="safe" />}
                {i === Math.min(rows.length - 2, 7) && (
                  <Zone label="منطقهٔ پایین" kind="relegate" />
                )}
              </div>
            ))
          : playerRows.map((r, i) => (
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
