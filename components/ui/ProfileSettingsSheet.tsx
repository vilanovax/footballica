"use client";

import { useGame } from "@/lib/store";
import { faNum } from "@/lib/format";
import {
  PLAYER_FOCUS_OPTIONS,
  playerFocusLabel,
  type PlayerFocus,
} from "@/lib/playerFocus";
import { PLAYER_SETTING_ROWS } from "@/lib/settings";
import { feedbackTap } from "@/lib/feedback";

interface ProfileSettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

function ProfileSettingToggle({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="profile-setting-row">
      <span className="profile-setting-row__copy">
        <span className="profile-setting-row__label">{label}</span>
        <span className="profile-setting-row__detail">{detail}</span>
      </span>
      <span className="profile-setting-toggle">
        <input
          type="checkbox"
          className="profile-setting-toggle__input"
          checked={checked}
          onChange={(e) => {
            onChange(e.target.checked);
            feedbackTap();
          }}
        />
        <span className="profile-setting-toggle__track" aria-hidden />
      </span>
    </label>
  );
}

function focusSummary(focus: PlayerFocus): string {
  if (focus === "arena") {
    return "Home با تاکید روی Quiz Arena چیده می‌شود و جدول کوییز پیش‌فرض می‌شود.";
  }
  if (focus === "club") {
    return "Home با تاکید روی باشگاه شروع می‌شود و جدول باشگاه پیش‌فرض می‌شود.";
  }
  return "Arena و Club با وزن برابر نمایش داده می‌شوند.";
}

export function ProfileSettingsSheet({ open, onClose }: ProfileSettingsSheetProps) {
  const playerFocus = useGame((s) => s.playerFocus);
  const setPlayerFocus = useGame((s) => s.setPlayerFocus);
  const soundEnabled = useGame((s) => s.soundEnabled);
  const hapticEnabled = useGame((s) => s.hapticEnabled);
  const advisorHintsEnabled = useGame((s) => s.advisorHintsEnabled);
  const setSoundEnabled = useGame((s) => s.setSoundEnabled);
  const setHapticEnabled = useGame((s) => s.setHapticEnabled);
  const setAdvisorHintsEnabled = useGame((s) => s.setAdvisorHintsEnabled);

  if (!open) return null;

  const enabledSettingsCount = [soundEnabled, hapticEnabled, advisorHintsEnabled].filter(Boolean).length;

  return (
    <div className="bank-sheet-root" role="dialog" aria-modal="true" aria-label="تنظیمات پروفایل">
      <button type="button" className="bank-sheet-backdrop" onClick={onClose} aria-label="بستن" />
      <div className="bank-sheet identity-sheet profile-settings-sheet">
        <div className="bank-sheet__handle" aria-hidden />
        <div className="bank-sheet__head">
          <button type="button" onClick={onClose} className="bank-sheet__close" aria-label="بستن">
            ✕
          </button>
          <div className="text-right flex-1">
            <h2 className="bank-sheet__title">تنظیمات</h2>
            <p className="bank-sheet__sub">تغییرات بلافاصله ذخیره می‌شوند.</p>
          </div>
          <span className="bank-sheet__icon profile-settings-sheet__icon" aria-hidden>
            تنظیم
          </span>
        </div>

        <div className="profile-settings-card">
          <div className="profile-settings-sheet__section">
            <div className="profile-settings-sheet__summary">
              <span className="profile-settings-focus-badge">{playerFocusLabel(playerFocus)}</span>
              <span className="profile-settings-sheet__summary-pill">
                {faNum(enabledSettingsCount)} از {faNum(PLAYER_SETTING_ROWS.length)} روشن
              </span>
            </div>
          </div>

          <div className="profile-settings-sheet__section">
            <p className="profile-settings-group__title">سبک بازی</p>
            <p className="profile-settings-group__sub">
              اولویت Arena یا Club را هر وقت خواستی عوض کن. این فقط ترتیب Home و جدول را
              تغییر می‌دهد.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-2">
              {PLAYER_FOCUS_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setPlayerFocus(opt.id);
                    feedbackTap();
                  }}
                  className={`profile-focus-chip ${
                    playerFocus === opt.id ? "profile-focus-chip--active" : ""
                  }`}
                >
                  <span className="profile-focus-chip__emoji" aria-hidden>
                    {opt.emoji}
                  </span>
                  <span className="profile-focus-chip__copy">
                    <span className="profile-focus-chip__label">{opt.label}</span>
                    <span className="profile-focus-chip__detail">{opt.detail}</span>
                  </span>
                </button>
              ))}
            </div>

            <p className="profile-focus-card__hint mt-3">{focusSummary(playerFocus)}</p>
          </div>

          <div className="profile-settings-divider" aria-hidden />

          <div className="profile-settings-sheet__section">
            <p className="profile-settings-group__title">تجربه بازی</p>
            <p className="profile-settings-group__sub">
              این تنظیم‌ها روی حس بازی اثر می‌گذارند و پیشرفتت را تغییر نمی‌دهند.
            </p>
            <div className="profile-settings-list">
              {PLAYER_SETTING_ROWS.map((row) => {
                const checked =
                  row.key === "soundEnabled"
                    ? soundEnabled
                    : row.key === "hapticEnabled"
                      ? hapticEnabled
                      : advisorHintsEnabled;
                const onChange =
                  row.key === "soundEnabled"
                    ? setSoundEnabled
                    : row.key === "hapticEnabled"
                      ? setHapticEnabled
                      : setAdvisorHintsEnabled;

                return (
                  <ProfileSettingToggle
                    key={row.key}
                    label={row.label}
                    detail={row.detail}
                    checked={checked}
                    onChange={onChange}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
