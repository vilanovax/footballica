"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/store";
import {
  CITIES,
  HEART_TEAMS,
  INTL_TEAMS,
  identityLabel,
  identityEmoji,
  isMeaningfulTeam,
  type IdentityOption,
} from "@/lib/playerIdentity";

interface ProfileIdentitySheetProps {
  open: boolean;
  onClose: () => void;
}

function ChipGrid({
  options,
  value,
  onChange,
}: {
  options: IdentityOption[];
  value?: string;
  onChange: (id: string | undefined) => void;
}) {
  return (
    <div className="identity-chip-grid">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(active ? undefined : o.id)}
            className={`identity-chip ${active ? "identity-chip--active" : ""}`}
          >
            {o.emoji && <span aria-hidden>{o.emoji}</span>}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ProfileIdentitySheet({ open, onClose }: ProfileIdentitySheetProps) {
  const club = useGame((s) => s.club);
  const updateClubProfile = useGame((s) => s.updateClubProfile);

  const [city, setCity] = useState(club.city);
  const [heartTeam, setHeartTeam] = useState(club.heartTeam);
  const [internationalTeam, setInternationalTeam] = useState(club.internationalTeam);

  useEffect(() => {
    if (!open) return;
    setCity(club.city);
    setHeartTeam(club.heartTeam);
    setInternationalTeam(club.internationalTeam);
  }, [open, club.city, club.heartTeam, club.internationalTeam]);

  if (!open) return null;

  function save() {
    updateClubProfile({
      city,
      heartTeam,
      internationalTeam:
        internationalTeam === "none_intl" ? undefined : internationalTeam,
    });
    onClose();
  }

  return (
    <div className="bank-sheet-root" role="dialog" aria-modal="true" aria-label="هویت بازیکن">
      <button type="button" className="bank-sheet-backdrop" onClick={onClose} aria-label="بستن" />
      <div className="bank-sheet identity-sheet">
        <div className="bank-sheet__handle" aria-hidden />
        <div className="bank-sheet__head">
          <button type="button" onClick={onClose} className="bank-sheet__close" aria-label="بستن">
            ✕
          </button>
          <div className="text-right flex-1">
            <h2 className="bank-sheet__title">هویت باشگاه</h2>
            <p className="bank-sheet__sub">شهر و تیم‌های محبوب — اختیاری</p>
          </div>
          <span className="bank-sheet__icon" aria-hidden>
            🎽
          </span>
        </div>

        <div className="identity-sheet__section">
          <p className="identity-sheet__label">شهر باشگاه</p>
          <ChipGrid options={CITIES} value={city} onChange={setCity} />
        </div>

        <div className="identity-sheet__section">
          <p className="identity-sheet__label">تیم قلبی</p>
          <ChipGrid options={HEART_TEAMS} value={heartTeam} onChange={setHeartTeam} />
        </div>

        <div className="identity-sheet__section">
          <p className="identity-sheet__label">تیم بین‌المللی محبوب</p>
          <ChipGrid
            options={INTL_TEAMS}
            value={internationalTeam}
            onChange={setInternationalTeam}
          />
        </div>

        <button
          type="button"
          onClick={save}
          className="btn-gold w-full rounded-2xl py-3.5 font-extrabold mt-2"
        >
          ذخیره
        </button>
      </div>
    </div>
  );
}

export function ProfileIdentityBadges({
  city,
  heartTeam,
  internationalTeam,
  onEdit,
  showEditButton = true,
}: {
  city?: string;
  heartTeam?: string;
  internationalTeam?: string;
  onEdit?: () => void;
  showEditButton?: boolean;
}) {
  const cityName = identityLabel(city, CITIES);
  const heartName = isMeaningfulTeam(heartTeam)
    ? identityLabel(heartTeam, HEART_TEAMS)
    : null;
  const intlName = isMeaningfulTeam(internationalTeam)
    ? identityLabel(internationalTeam, INTL_TEAMS)
    : null;

  const hasAny = cityName || heartName || intlName;

  if (!hasAny) {
    return null;
  }

  return (
    <div className="profile-identity-badges mt-2 flex flex-wrap justify-center gap-1.5">
      {cityName && (
        <span className="profile-identity-pill">
          {identityEmoji(city, CITIES)} {cityName}
        </span>
      )}
      {heartName && (
        <span className="profile-identity-pill profile-identity-pill--team">
          {identityEmoji(heartTeam, HEART_TEAMS)} {heartName}
        </span>
      )}
      {intlName && (
        <span className="profile-identity-pill profile-identity-pill--intl">
          {identityEmoji(internationalTeam, INTL_TEAMS)} {intlName}
        </span>
      )}
      {onEdit && showEditButton && (
        <button type="button" onClick={onEdit} className="profile-identity-edit">
          ویرایش
        </button>
      )}
    </div>
  );
}
