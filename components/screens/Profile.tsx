"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import {
  ProfileIdentityBadges,
  ProfileIdentitySheet,
} from "@/components/ui/ProfileIdentitySheet";
import { useGame } from "@/lib/store";
import { faNum, faCount } from "@/lib/format";
import { levelInfo, leagueForXp } from "@/lib/player";
import { nextUnlock } from "@/lib/progress";
import { CLUB } from "@/lib/club";

interface ProfileProps {
  onOpenClub: () => void;
  onOpenMissions: () => void;
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

export function Profile({ onOpenClub, onOpenMissions }: ProfileProps) {
  const [identityOpen, setIdentityOpen] = useState(false);
  const cards = useGame((s) => s.cards);
  const xp = useGame((s) => s.xp);
  const fans = useGame((s) => s.fans);
  const streakDays = useGame((s) => s.streakDays);
  const totalCorrect = useGame((s) => s.totalCorrect);
  const gamesPlayed = useGame((s) => s.gamesPlayed);
  const matchesWon = useGame((s) => s.matchesWon);
  const club = useGame((s) => s.club);
  const claimableMissions = useGame((s) => s.claimableMissions);
  const resetSave = useGame((s) => s.resetSave);

  const { level, into, need, pct } = levelInfo(xp);
  const league = leagueForXp(xp);
  const unlock = nextUnlock(level);
  const missionBadge = claimableMissions();

  return (
    <div className="pitch-stripes min-h-dvh pb-32">
      {/* manager card hero */}
      <section className="profile-hero mx-5 mt-5 rounded-3xl overflow-hidden text-center">
        <div className="profile-hero__spotlight" aria-hidden />
        <div className="relative px-5 pt-6 pb-5">
          <div className="profile-avatar-wrap mx-auto">
            <div className="profile-avatar-ring" aria-hidden />
            <Avatar label={club.crest} color={club.color} size={96} />
            <span className="profile-level-shield" aria-label={`سطح ${faNum(level)}`}>
              {faNum(level)}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold text-white tracking-tight">
            {club.name}
          </h1>
          <p className="profile-league-ribbon">{league}</p>

          <ProfileIdentityBadges
            city={club.city}
            heartTeam={club.heartTeam}
            internationalTeam={club.internationalTeam}
            onEdit={() => setIdentityOpen(true)}
          />

          <div className="profile-xp mt-5">
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
            <p className="profile-xp__meta">
              <span>{faNum(into)}</span>
              <span className="text-white/35"> / </span>
              <span>{faNum(need)} XP</span>
            </p>
          </div>

          {unlock && (
            <p className="profile-unlock-hint mt-3 text-xs leading-5">
              سطح {faNum(unlock.level)}:{" "}
              <span className="text-gold-400/90">{unlock.label}</span>
            </p>
          )}
        </div>
      </section>

      {/* career stats */}
      <section className="px-5 mt-6">
        <div className="profile-section-head mb-3">
          <span className="profile-section-eyebrow">فصل جاری</span>
          <h2 className="profile-section-title">کارنامهٔ مدیر</h2>
        </div>
        <div className="profile-stat-grid">
          <CareerStat emoji="⚽" value={faNum(gamesPlayed)} label="بازی" />
          <CareerStat emoji="🏆" value={faNum(matchesWon)} label="برد" accent />
          <CareerStat emoji="🎯" value={faCount(totalCorrect)} label="درست" />
          <CareerStat emoji="🔥" value={faNum(streakDays)} label="استریک" accent />
          <CareerStat emoji="🎽" value={faCount(fans)} label="هوادار" />
          <CareerStat emoji="⚡" value={faNum(cards)} label="کارت تاکتیکی" />
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
              <p className="profile-quest-card__title">مسیر باشگاه</p>
              <p className="profile-quest-card__sub">
                {missionBadge > 0
                  ? `${faNum(missionBadge)} جایزهٔ آماده — بگیر!`
                  : `${faNum(totalCorrect)} جواب درست · پیشرفت را ببین`}
              </p>
            </div>
            {missionBadge > 0 ? (
              <span className="profile-quest-badge">{faNum(missionBadge)}</span>
            ) : (
              <span className="profile-chevron" aria-hidden>
                ‹
              </span>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenClub}
          className="profile-club-card w-full text-right"
        >
          <div className="flex items-center gap-3">
            <div className="profile-club-card__crest">
              <Avatar label={club.crest} color={club.color} size={52} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="profile-club-card__title">باشگاه من</p>
              <div className="mt-1 flex flex-wrap justify-end gap-1.5">
                <span className="profile-club-pill">{CLUB.division}</span>
                <span className="profile-club-pill profile-club-pill--fans">
                  {faCount(fans)} هوادار
                </span>
              </div>
            </div>
            <span className="profile-chevron" aria-hidden>
              ‹
            </span>
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
    </div>
  );
}
