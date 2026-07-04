"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import {
  ProfileIdentityBadges,
  ProfileIdentitySheet,
} from "@/components/ui/ProfileIdentitySheet";
import { CollectionShowcase } from "@/components/ui/CollectionShowcase";
import { useGame } from "@/lib/store";
import { faNum, faCount } from "@/lib/format";
import { levelInfo, leagueForXp } from "@/lib/player";
import { nextUnlock } from "@/lib/progress";
import { ACHIEVEMENT_MISSIONS } from "@/lib/missions";
import { CLUB } from "@/lib/club";
import { useClubAvatar } from "@/lib/clubAvatar";
import { ownedCollectibleCount } from "@/lib/collectibles";

interface ProfileProps {
  onOpenClub: () => void;
  onOpenMissions: () => void;
  onOpenShop?: () => void;
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

export function Profile({ onOpenClub, onOpenMissions, onOpenShop }: ProfileProps) {
  const [identityOpen, setIdentityOpen] = useState(false);
  const cards = useGame((s) => s.cards);
  const xp = useGame((s) => s.xp);
  const fans = useGame((s) => s.fans);
  const streakDays = useGame((s) => s.streakDays);
  const totalCorrect = useGame((s) => s.totalCorrect);
  const gamesPlayed = useGame((s) => s.gamesPlayed);
  const matchesWon = useGame((s) => s.matchesWon);
  const club = useGame((s) => s.club);
  const ownedCollectibles = useGame((s) => s.ownedCollectibles);
  const clubAvatar = useClubAvatar();
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
  const rankValue = gamesPlayed > 0 ? faNum(CLUB.rank) : "-";

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
          <ProfileResourceCard value={rankValue} label="رتبهٔ هفتگی" />
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

      <div className="profile-danger-zone mx-5 mt-10">
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
    </div>
  );
}
