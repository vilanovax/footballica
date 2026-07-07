"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import {
  ProfileIdentityBadges,
  ProfileIdentitySheet,
} from "@/components/ui/ProfileIdentitySheet";
import { ProfileSettingsSheet } from "@/components/ui/ProfileSettingsSheet";
import { Button } from "@/components/ui/Button";
import { CollectionShowcase } from "@/components/ui/CollectionShowcase";
import { useGame } from "@/lib/store";
import { faNum, faCount } from "@/lib/format";
import { formatRegenCountdown, levelInfo, leagueForXp, msUntilNextLife } from "@/lib/player";
import { nextUnlock } from "@/lib/progress";
import { ACHIEVEMENT_MISSIONS } from "@/lib/missions";
import { CLUB } from "@/lib/club";
import { useClubAvatar } from "@/lib/clubAvatar";
import { ownedCollectibleCount } from "@/lib/collectibles";
import { fairPlayScore } from "@/lib/leaderboards";
import { playerFocusLabel } from "@/lib/playerFocus";

interface ProfileProps {
  onOpenClub: () => void;
  onOpenMissions: () => void;
  onOpenShop?: () => void;
  onPlayRankedDuel?: () => void;
  onOpenFairPlayLeaderboard?: () => void;
  /** باز کردن خودکار sheet هویت — مثلاً از CTA جدول جامعه */
  initialIdentityOpen?: boolean;
  onIdentityOpenHandled?: () => void;
}

function ProfileResourceCard({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className={`profile-resource-card ${accent ? "profile-resource-card--accent" : ""}`}>
      <p className="profile-resource-card__value tabular-nums">{value}</p>
      <p className="profile-resource-card__label">{label}</p>
    </div>
  );
}

function CareerStat({
  emoji,
  value,
  label,
  accent,
}: {
  emoji: string;
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className={`profile-stat ${accent ? "profile-stat--accent" : ""}`}>
      <span className="profile-stat__emoji" aria-hidden>
        {emoji}
      </span>
      <p className="profile-stat__value tabular-nums">{value}</p>
      <p className="profile-stat__label">{label}</p>
    </div>
  );
}

export function Profile({
  onOpenClub,
  onOpenMissions,
  onOpenShop,
  onPlayRankedDuel,
  onOpenFairPlayLeaderboard,
  initialIdentityOpen,
  onIdentityOpenHandled,
}: ProfileProps) {
  const [identityOpen, setIdentityOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!initialIdentityOpen) return;
    setIdentityOpen(true);
    onIdentityOpenHandled?.();
  }, [initialIdentityOpen, onIdentityOpenHandled]);
  const cards = useGame((s) => s.cards);
  const xp = useGame((s) => s.xp);
  const fans = useGame((s) => s.fans);
  const streakDays = useGame((s) => s.streakDays);
  const totalCorrect = useGame((s) => s.totalCorrect);
  const gamesPlayed = useGame((s) => s.gamesPlayed);
  const matchesWon = useGame((s) => s.matchesWon);
  const arenaRating = useGame((s) => s.arenaRating);
  const rankedWins = useGame((s) => s.rankedWins);
  const rankedLosses = useGame((s) => s.rankedLosses);
  const lives = useGame((s) => s.lives);
  const livesUpdatedAt = useGame((s) => s.livesUpdatedAt);
  const club = useGame((s) => s.club);
  const ownedCollectibles = useGame((s) => s.ownedCollectibles);
  const clubAvatar = useClubAvatar();
  const playerFocus = useGame((s) => s.playerFocus);
  const soundEnabled = useGame((s) => s.soundEnabled);
  const hapticEnabled = useGame((s) => s.hapticEnabled);
  const advisorHintsEnabled = useGame((s) => s.advisorHintsEnabled);
  const missionClaimed = useGame((s) => s.missionClaimed);
  const claimableMissions = useGame((s) => s.claimableMissions);
  const resetSave = useGame((s) => s.resetSave);

  const { level, into, need, pct } = levelInfo(xp);
  const league = leagueForXp(xp);
  const unlock = nextUnlock(level);
  const missionBadge = claimableMissions();
  const xpRemaining = Math.max(0, need - into);
  const achievementCount = ACHIEVEMENT_MISSIONS.filter((m) => missionClaimed[m.id]).length;
  const collectionCount = ownedCollectibleCount(ownedCollectibles);
  const hasIdentity = Boolean(club.city || club.heartTeam || club.internationalTeam);
  const rankedTotal = rankedWins + rankedLosses;
  const rankedWinRate = rankedTotal > 0 ? Math.round((rankedWins / rankedTotal) * 100) : 0;
  const fairPlayValue = fairPlayScore({ arenaRating, rankedWins, rankedLosses });
  const enabledSettingsCount = [soundEnabled, hapticEnabled, advisorHintsEnabled].filter(Boolean).length;
  const canRankedDuel = lives > 0;
  const regenIn = formatRegenCountdown(msUntilNextLife(lives, livesUpdatedAt));

  return (
    <div className="pitch-stripes min-h-dvh pb-32">
      {/* manager card hero */}
      <section className="profile-hero mx-5 mt-5 rounded-3xl overflow-hidden text-center">
        <div className="profile-hero__spotlight" aria-hidden />
        <div className="relative px-5 pt-6 pb-5">
          <div className="profile-avatar-wrap mx-auto">
            <div className="profile-avatar-ring" aria-hidden />
            <Avatar label={clubAvatar.label} color={clubAvatar.color} size={96} />
            <span className="profile-level-shield" aria-label={`سطح ${faNum(level)}`}>
              {faNum(level)}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold text-white tracking-tight">
            {club.name}
          </h1>
          <p className="profile-league-ribbon">{league}</p>

          <div className="profile-level-panel">
            <div className="profile-level-panel__top">
              <span className="profile-level-panel__level">سطح {faNum(level)}</span>
              <span className="profile-level-panel__xp">
                XP: {faNum(into)} / {faNum(need)}
              </span>
            </div>

            <div className="profile-xp mt-4">
              <div className="profile-xp__labels">
                <span className="profile-xp__tag">سطح {faNum(level)}</span>
                <span className="profile-xp__tag profile-xp__tag--next">
                  سطح {faNum(level + 1)}
                </span>
              </div>
              <div className="profile-xp__track">
                <div
                  className="profile-xp__fill"
                  style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
                />
              </div>
              <div className="profile-xp__meta">
                <span>{faNum(xpRemaining)} XP تا سطح بعد</span>
                <span className="profile-xp__meta-sep" aria-hidden>
                  ·
                </span>
                <span>
                  {faNum(into)} / {faNum(need)}
                </span>
              </div>
            </div>

            {unlock && (
              <div className="profile-next-unlock mt-3">
                <p className="profile-next-unlock__eyebrow">جایزهٔ سطح بعد</p>
                <p className="profile-next-unlock__title">
                  باز شدن در سطح {faNum(unlock.level)}
                </p>
                <p className="profile-next-unlock__sub">{unlock.label}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-5 mt-4">
        <div className="profile-resource-grid">
          <ProfileResourceCard value={faCount(fans)} label="هوادار" />
          <ProfileResourceCard value={faNum(cards)} label="کارت تاکتیکی" accent />
          <ProfileResourceCard value={faNum(achievementCount)} label="افتخار" />
          <ProfileResourceCard value={faNum(arenaRating)} label="ریتینگ Arena" />
        </div>
      </section>

      <section className="px-5 mt-4">
        <button
          type="button"
          onClick={() => setIdentityOpen(true)}
          className={`profile-identity-card w-full text-right ${
            hasIdentity ? "profile-identity-card--filled" : ""
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="profile-identity-card__icon" aria-hidden>
              📍
            </span>
            <div className="flex-1 min-w-0">
              <p className="profile-card__eyebrow">
                {hasIdentity ? "هویت باشگاه" : "شخصی‌سازی باشگاه"}
              </p>
              <p className="profile-identity-card__title">
                {hasIdentity ? "هویت باشگاهت ثبت شده" : "شهر و تیم محبوبت را انتخاب کن"}
              </p>
              <p className="profile-identity-card__sub">
                {hasIdentity
                  ? "برای رویدادها، لیگ شهرها و هویت باشگاهت آماده‌ای."
                  : "برای رویدادها، لیگ شهرها و پاداش‌های تیمی"}
              </p>
            </div>
            <span className="profile-action-chip profile-action-chip--identity">
              {hasIdentity ? "ویرایش" : "تکمیل پروفایل"}
            </span>
          </div>
          {hasIdentity && (
            <ProfileIdentityBadges
              city={club.city}
              heartTeam={club.heartTeam}
              internationalTeam={club.internationalTeam}
              showEditButton={false}
            />
          )}
        </button>
      </section>

      <section className="px-5 mt-4">
        <CollectionShowcase onOpenShop={onOpenShop} />
      </section>

      <section className="px-5 mt-4">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="profile-settings-entry w-full text-right"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="profile-card__eyebrow">ترجیحات و تجربه بازی</p>
              <p className="profile-settings-entry__title">تنظیمات</p>
              <p className="profile-settings-entry__sub">
                صدا، لرزش، راهنمای مربی و اولویت Arena/Club را در یک شیت جدا مدیریت کن.
              </p>
              <div className="profile-settings-entry__meta">
                <span className="profile-settings-entry__pill">{playerFocusLabel(playerFocus)}</span>
                <span className="profile-settings-entry__pill">
                  {faNum(enabledSettingsCount)}/۳ روشن
                </span>
              </div>
            </div>
            <span className="profile-action-chip">باز کردن</span>
          </div>
        </button>
      </section>

      <section className="px-5 mt-6">
        <div className="profile-section-head mb-3">
          <span className="profile-section-eyebrow">skill-first</span>
          <h2 className="profile-section-title">Arena و Fair Play</h2>
        </div>
        <div className="profile-arena-card">
          <div className="flex items-start justify-between gap-3">
            <span className="profile-arena-card__badge">بدون پاورآپ</span>
            <div className="flex-1 text-right">
              <p className="profile-card__eyebrow">دوئل رقابتی</p>
              <p className="profile-arena-card__title">آمار رنکد و جدول Fair Play</p>
              <p className="profile-arena-card__sub">
                این مسیر فقط از دوئل رنکد تغذیه می‌شود و به اقتصاد باشگاه مزیت مستقیم
                نمی‌دهد.
              </p>
            </div>
          </div>

          <div className="profile-resource-grid mt-4">
            <ProfileResourceCard value={faNum(arenaRating)} label="ریتینگ Arena" accent />
            <ProfileResourceCard value={faNum(fairPlayValue)} label="امتیاز Fair Play" />
            <ProfileResourceCard value={faNum(rankedWins)} label="برد رنکد" accent />
            <ProfileResourceCard value={faNum(rankedLosses)} label="باخت رنکد" />
          </div>

          <p className="profile-arena-card__hint">
            {rankedTotal > 0
              ? `${faNum(rankedWinRate)}٪ برد در ${faNum(rankedTotal)} دوئل رنکد`
              : "هنوز وارد دوئل رنکد نشده‌ای؛ یک رنکد بزن تا Fair Play فعال شود."}
          </p>

          {(onPlayRankedDuel || onOpenFairPlayLeaderboard) && (
            <div className="profile-arena-card__actions">
              {onPlayRankedDuel && (
                <Button
                  onClick={onPlayRankedDuel}
                  variant="primary"
                  size="sm"
                  fullWidth
                  disabled={!canRankedDuel}
                  className="profile-arena-card__cta"
                >
                  {canRankedDuel
                    ? "شروع دوئل رنکد"
                    : regenIn
                      ? `نیاز ۱ ❤️ · ${regenIn}`
                      : "نیاز ۱ ❤️"}
                </Button>
              )}
              {onOpenFairPlayLeaderboard && (
                <Button
                  onClick={onOpenFairPlayLeaderboard}
                  variant="secondary"
                  size="sm"
                  fullWidth
                  className="profile-arena-card__cta profile-arena-card__cta--secondary"
                >
                  جدول Fair Play
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* season stats */}
      <section className="px-5 mt-6">
        <div className="profile-section-head mb-3">
          <span className="profile-section-eyebrow">رکوردهای من</span>
          <h2 className="profile-section-title">آمار فصل</h2>
        </div>
        <div className="profile-stat-grid">
          <CareerStat emoji="⚽" value={faNum(gamesPlayed)} label="بازی" />
          <CareerStat emoji="🏆" value={faNum(matchesWon)} label="برد" accent />
          <CareerStat emoji="🎯" value={faCount(totalCorrect)} label="جواب درست" />
          <CareerStat emoji="🎽" value={faCount(fans)} label="هوادار" />
          <CareerStat emoji="⚡" value={faNum(cards)} label="کارت تاکتیکی" accent />
          <CareerStat emoji="🔥" value={faNum(streakDays)} label="روز استریک" />
          <CareerStat emoji="🧩" value={faNum(collectionCount)} label="کلکسیون" />
        </div>
      </section>

      {/* quests & club */}
      <section className="px-5 mt-6 space-y-3">
        <button
          type="button"
          onClick={onOpenMissions}
          className={`profile-quest-card w-full text-right ${
            missionBadge > 0 ? "profile-quest-card--ready" : ""
          }`}
        >
          <div className="profile-quest-card__glow" aria-hidden />
          <div className="relative flex items-center gap-3">
            <span className="profile-quest-card__icon">🎯</span>
            <div className="flex-1 min-w-0">
              <p className="profile-card__eyebrow">اولویت امروز</p>
              <p className="profile-quest-card__title">مسیر باشگاه</p>
              <p className="profile-quest-card__sub">
                {missionBadge > 0
                  ? `${faNum(missionBadge)} جایزهٔ آماده — همین حالا بگیر`
                  : `${faNum(totalCorrect)} جواب درست · پیشرفت و جایزه‌ها را ببین`}
              </p>
            </div>
            <div className="profile-quest-card__aside">
              {missionBadge > 0 && <span className="profile-quest-badge">{faNum(missionBadge)}</span>}
              <span className="profile-action-chip">
                {missionBadge > 0 ? "رفتن و دریافت" : "رفتن به مسیر باشگاه"}
              </span>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenClub}
          className="profile-club-card w-full text-right"
        >
          <div className="flex items-center gap-3">
            <div className="profile-club-card__crest">
              <Avatar label={clubAvatar.label} color={clubAvatar.color} size={52} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="profile-card__eyebrow">اتاق فرمان</p>
              <p className="profile-club-card__title">اتاق فرمان باشگاه</p>
              <p className="profile-club-card__sub">
                لوگو، رنگ، شهر و تیم محبوب باشگاهت را تنظیم کن.
              </p>
              <div className="mt-1 flex flex-wrap justify-end gap-1.5">
                <span className="profile-club-pill">{CLUB.division}</span>
                <span className="profile-club-pill profile-club-pill--fans">
                  {faCount(fans)} هوادار
                </span>
              </div>
            </div>
            <span className="profile-action-chip profile-action-chip--club">ورود</span>
          </div>
        </button>
      </section>

      <div className="profile-danger-zone mx-5 mt-8">
        <p className="profile-danger-zone__label">منطقهٔ خطر</p>
        <button
          type="button"
          onClick={() => {
            if (confirm("پیشرفتت پاک شود و از اول شروع کنی؟")) resetSave();
          }}
          className="profile-reset-btn"
        >
          شروعِ دوباره · ریست پیشرفت
        </button>
      </div>

      <ProfileIdentitySheet open={identityOpen} onClose={() => setIdentityOpen(false)} />
      <ProfileSettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
