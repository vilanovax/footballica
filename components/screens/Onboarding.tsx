"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useGame, type ClubIdentity } from "@/lib/store";
import { CLUB_COLOR_OPTIONS } from "@/lib/designSystem";
import {
  CITIES,
  HEART_TEAMS,
  identityEmoji,
  identityLabel,
  type IdentityOption,
} from "@/lib/playerIdentity";

interface OnboardingProps {
  onDone: () => void;
}

type OnboardingPhase = "story" | "setup" | "prefs";

const COLORS = [...CLUB_COLOR_OPTIONS];
const CRESTS = ["🦅", "🦁", "🐺", "🐉", "⚽", "🛡️", "⭐", "🔥"];
const STORY_BEATS = 3;

const PHASE_LABELS: Record<OnboardingPhase, string> = {
  story: "داستان",
  setup: "ساخت باشگاه",
  prefs: "شخصی‌سازی",
};

function OnboardingProgress({
  phase,
  storyBeat,
}: {
  phase: OnboardingPhase;
  storyBeat: number;
}) {
  const phases: OnboardingPhase[] = ["story", "setup", "prefs"];
  const phaseIndex = phases.indexOf(phase);

  return (
    <div className="relative z-10 mb-5">
      <p className="ob-phase-label mb-2">
        فصل ۱ · {PHASE_LABELS[phase]}
        {phase === "story" && ` · ${storyBeat + 1}/${STORY_BEATS}`}
      </p>
      <div className="ob-progress" aria-hidden>
        {phases.map((p, i) => {
          let state = "";
          if (i < phaseIndex) state = "ob-progress__seg--done";
          else if (i === phaseIndex) state = "ob-progress__seg--active";
          return <span key={p} className={`ob-progress__seg ${state}`} />;
        })}
      </div>
    </div>
  );
}

function StoryDots({ beat }: { beat: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden>
      {Array.from({ length: STORY_BEATS }, (_, i) => (
        <span
          key={i}
          className={`onboarding-dot h-1.5 rounded-full transition-all duration-300 ${
            i === beat ? "onboarding-dot--active w-6" : "w-1.5"
          }`}
        />
      ))}
    </div>
  );
}

function StoryFlow() {
  const steps = [
    { icon: "⚽", label: "کویز", sub: "پاسخ درست", accent: false },
    { icon: "🏪", label: "واحدها", sub: "جمع‌آوری", accent: false },
    { icon: "🔐", label: "خزانه", sub: "پول قابل خرج", accent: true },
    { icon: "📈", label: "رشد", sub: "ارتقا و درآمد", accent: false },
  ];

  return (
    <div className="ob-flow">
      {steps.map((s, i) => (
        <div key={s.label} className="flex flex-1 items-center gap-0.5 min-w-0">
          <div
            className={`ob-flow__step flex-1 ${s.accent ? "ob-flow__step--accent" : ""}`}
          >
            <span className="ob-flow__icon">{s.icon}</span>
            <p className="ob-flow__label">{s.label}</p>
            <p className="ob-flow__sub">{s.sub}</p>
          </div>
          {i < steps.length - 1 && <span className="ob-flow__arrow">←</span>}
        </div>
      ))}
    </div>
  );
}

function ContractCard() {
  const rows = [
    { label: "لیگ", value: "دستهٔ سه", accent: true },
    { label: "وضعیت", value: "ورشکسته · هوادارِ کم" },
    { label: "خزانه", value: "خالی — آمادهٔ پر شدن" },
    { label: "هدیهٔ شروع", value: "۲ کارتِ تاکتیکی", accent: true },
  ];

  return (
    <div className="ob-contract onboarding-contract rounded-3xl overflow-hidden">
      <div className="onboarding-contract-header px-4 py-3 flex items-center justify-between">
        <span className="text-[10px] font-bold text-pitch-800/55 tracking-wide">
          قراردادِ خرید
        </span>
        <span className="rounded-md bg-gold-400/25 px-2 py-0.5 text-[10px] font-extrabold text-[#6b4a00]">
          پیش‌نویس
        </span>
      </div>
      <div className="px-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="onboarding-contract-crest grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-3xl">
            🏚️
          </div>
          <div className="flex-1 text-right min-w-0">
            <p className="text-lg font-extrabold text-pitch-900 leading-tight">
              باشگاهِ دستهٔ سه
            </p>
            <p className="mt-0.5 text-xs text-pitch-800/65">
              ورزشگاهِ نیمه‌خراب · بدونِ اسپانسر
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between rounded-xl onboarding-contract-row px-3 py-2"
            >
              <span
                className={`text-xs font-extrabold ${
                  r.accent ? "text-gold-600" : "text-pitch-900"
                }`}
              >
                {r.value}
              </span>
              <span className="text-[11px] text-pitch-800/50">{r.label}</span>
            </div>
          ))}
        </div>

        <p className="mt-3 text-center text-[10px] text-pitch-800/45 leading-5">
          با امضا، مالکیت و مسئولیتِ احیای باشگاه با توست.
        </p>
      </div>
    </div>
  );
}

function StoryIntro({
  beat,
  onNext,
}: {
  beat: number;
  onNext: () => void;
}) {
  const isLast = beat === STORY_BEATS - 1;

  const beatMeta = [
    { kicker: "فصل ۱ · معامله", hint: "بعد: چطور باشگاه را احیا می‌کنی" },
    { kicker: "فصل ۱ · مسیر تو", hint: "بعد: امضای قرارداد" },
    { kicker: "فصل ۱ · امضا", hint: "" },
  ][beat];

  return (
    <div className="ob-shell pitch-stripes flex flex-col px-5 py-6">
      <div className="onboarding-story-glow pointer-events-none" aria-hidden />

      <OnboardingProgress phase="story" storyBeat={beat} />

      <div className="relative z-10 flex flex-col flex-1">
        <div key={beat} className="animate-rise flex-1 flex flex-col">
          {beat === 0 && (
            <>
              <div className="text-center">
                <div className="ob-hero-ring mx-auto">
                  <div className="onboarding-hero-icon grid h-24 w-24 place-items-center rounded-3xl text-5xl animate-pop">
                    🏟️
                  </div>
                </div>
                <h1 className="mt-5 text-[1.75rem] font-extrabold leading-tight text-white">
                  یک باشگاه،
                  <br />
                  <span className="text-gold-400">از خاک</span>
                </h1>
              </div>

              <div className="ob-story-card onboarding-story-card mt-6 rounded-3xl p-5 text-right leading-8">
                <p className="text-[15px] text-white/88">
                  تو با <span className="ob-highlight">آخرین پولت</span> یک باشگاهِ
                  قدیمی و ارزان در{" "}
                  <strong className="text-white">دستهٔ سه</strong> می‌خری.
                </p>
                <p className="mt-3 text-sm text-white/65 leading-7">
                  ورزشگاه نیمه‌خراب است، تابلوی اسپانسری خالی، و هوادارها فقط
                  آرزوی روزهای بهتر را در سر دارند.
                </p>
              </div>

              <div className="onboarding-quote mt-4 rounded-2xl px-4 py-3 text-center">
                <p className="text-sm italic text-white/55 leading-6">
                  «همه می‌گویند این باشگاه مرده است. تو هنوز جواب نداده‌ای.»
                </p>
              </div>
            </>
          )}

          {beat === 1 && (
            <>
              <div className="text-center">
                <div className="ob-hero-ring mx-auto">
                  <div className="onboarding-hero-icon grid h-24 w-24 place-items-center rounded-3xl text-5xl animate-pop">
                    🧠
                  </div>
                </div>
                <h1 className="mt-5 text-[1.75rem] font-extrabold leading-tight text-white">
                  سلاحِ تو:
                  <br />
                  <span className="text-grass-400">دانشِ فوتبال</span>
                </h1>
              </div>

              <div className="ob-story-card onboarding-story-card mt-5 rounded-3xl p-5 text-right">
                <p className="text-[15px] text-white/88 leading-8">
                  در کویزها جواب بده. هر پاسخ درست →{" "}
                  <span className="ob-highlight">پول به خزانه</span>، XP، هوادار
                  و کارت تاکتیکی.
                </p>
                <p className="mt-3 text-sm text-white/65 leading-7">
                  واحدها درآمد می‌سازند — جمع‌آوری کن، مستقیم از خزانه خرج کن،
                  مدیر استخدام کن و باشگاه را قدم‌به‌قدم زنده کن.
                </p>
              </div>

              <div className="mt-4">
                <StoryFlow />
              </div>
            </>
          )}

          {beat === 2 && (
            <>
              <div className="text-center mb-4">
                <h1 className="text-2xl font-extrabold text-white leading-tight">
                  قراردادِ تو
                </h1>
                <p className="mt-2 text-sm text-white/55">
                  همه‌چیز از همین‌جا شروع می‌شود
                </p>
              </div>

              <ContractCard />

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { icon: "🃏", label: "۲ کارت" },
                  { icon: "🏪", label: "فروشگاه" },
                  { icon: "🔐", label: "خزانه" },
                ].map((p) => (
                  <div
                    key={p.label}
                    className={`ob-perk onboarding-perk rounded-xl py-3 text-center ${
                      p.label === "خزانه" ? "ob-perk--gold" : ""
                    }`}
                  >
                    <span className="text-xl">{p.icon}</span>
                    <p className="mt-1 text-[10px] font-bold text-white/70">
                      {p.label}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="ob-footer relative z-10 mt-auto pt-5 space-y-3">
          <StoryDots beat={beat} />
          <button
            type="button"
            onClick={onNext}
            className="btn-gold w-full rounded-2xl py-4 text-lg font-extrabold active:scale-[0.98] transition-transform"
          >
            {isLast ? "قبول می‌کنم، مالِ من است ✍️" : "ادامه ←"}
          </button>
          {beatMeta.hint && (
            <p className="text-center text-[10px] text-white/30">{beatMeta.hint}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PrefsChipGrid({
  options,
  value,
  onChange,
  variant,
}: {
  options: IdentityOption[];
  value?: string;
  onChange: (id: string | undefined) => void;
  variant: "team" | "city";
}) {
  const gridClass =
    variant === "team" ? "ob-chip-grid--teams" : "ob-chip-grid";

  return (
    <div className={gridClass}>
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(active ? undefined : o.id)}
            className={`ob-chip ${variant === "team" ? "ob-chip--team" : ""} ${
              active ? "ob-chip--active" : ""
            }`}
          >
            {o.emoji && (
              <span className="ob-chip__emoji" aria-hidden>
                {o.emoji}
              </span>
            )}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function OnboardingPrefs({
  heartTeam,
  city,
  onHeartTeam,
  onCity,
  onSkip,
  onContinue,
}: {
  heartTeam?: string;
  city?: string;
  onHeartTeam: (id: string | undefined) => void;
  onCity: (id: string | undefined) => void;
  onSkip: () => void;
  onContinue: () => void;
}) {
  const hasSelection = Boolean(heartTeam || city);
  const teamLabel = identityLabel(heartTeam, HEART_TEAMS);
  const cityLabel = identityLabel(city, CITIES);

  return (
    <div className="ob-shell pitch-stripes flex flex-col px-5 py-6 min-h-dvh">
      <OnboardingProgress phase="prefs" storyBeat={0} />

      <h1 className="relative z-10 text-2xl font-extrabold text-center text-white">
        باشگاهت کجاست؟
      </h1>
      <p className="relative z-10 mt-1 text-center text-sm text-white/55 leading-6">
        اختیاری — برای رویدادها و رقابت شهری
      </p>

      <div className="relative z-10 mt-4 ob-prefs-preview">
        {hasSelection ? (
          <div className="flex flex-wrap justify-end gap-2 flex-1">
            {teamLabel && (
              <span className="ob-prefs-badge">
                {identityEmoji(heartTeam, HEART_TEAMS)} {teamLabel}
              </span>
            )}
            {cityLabel && (
              <span className="ob-prefs-badge">
                {identityEmoji(city, CITIES)} {cityLabel}
              </span>
            )}
          </div>
        ) : (
          <p className="ob-prefs-preview__empty flex-1 text-right">
            هنوز چیزی انتخاب نکردی — می‌توانی بعداً در پروفایل تکمیل کنی
          </p>
        )}
        <span className="text-2xl shrink-0" aria-hidden>
          🗺️
        </span>
      </div>

      <div className="relative z-10 mt-5 space-y-4 flex-1 overflow-y-auto pb-2">
        <div className="ob-chip-section">
          <p className="ob-field-label mb-3">تیم قلبی تو</p>
          <PrefsChipGrid
            options={HEART_TEAMS.filter((t) => t.id !== "none_iran")}
            value={heartTeam}
            onChange={onHeartTeam}
            variant="team"
          />
        </div>

        <div className="ob-chip-section">
          <p className="ob-field-label mb-3">شهر باشگاه</p>
          <PrefsChipGrid
            options={CITIES.filter((c) => c.id !== "other")}
            value={city}
            onChange={onCity}
            variant="city"
          />
        </div>
      </div>

      <div className="relative z-10 ob-footer mt-4 space-y-1">
        <button
          type="button"
          onClick={onContinue}
          className="btn-gold w-full rounded-2xl py-4 text-lg font-extrabold active:scale-[0.98] transition-transform"
        >
          {hasSelection ? "ادامه → اولین بازی" : "شروع بازی ⚽"}
        </button>
        <button type="button" onClick={onSkip} className="ob-skip-link">
          بعداً تکمیل می‌کنم
        </button>
      </div>
    </div>
  );
}

function OnboardingSetup({
  name,
  color,
  crest,
  onName,
  onColor,
  onCrest,
  onContinue,
}: {
  name: string;
  color: string;
  crest: string;
  onName: (v: string) => void;
  onColor: (v: string) => void;
  onCrest: (v: string) => void;
  onContinue: () => void;
}) {
  const displayName = name.trim() || "باشگاهِ من";

  return (
    <div className="ob-shell pitch-stripes flex flex-col px-5 py-6 min-h-dvh">
      <OnboardingProgress phase="setup" storyBeat={0} />

      <h1 className="relative z-10 text-2xl font-extrabold text-center text-white">
        باشگاهت را بساز
      </h1>
      <p className="relative z-10 mt-1 text-center text-sm text-white/55">
        اسم، رنگ و نشان — اولین قدمِ مالکیت
      </p>

      <div className="relative z-10 ob-preview-card onboarding-preview mt-5 flex flex-col items-center gap-3 rounded-3xl py-7 px-4">
        <div className="ob-preview-pitch" aria-hidden />
        <Avatar label={crest} color={color} size={96} />
        <p className="text-xl font-extrabold text-white relative z-1">
          {displayName}
        </p>
        <span className="onboarding-badge relative z-1 rounded-lg px-3 py-1 text-sm font-bold text-gold-400">
          🏆 دستهٔ سه · تازه‌تأسیس
        </span>
      </div>

      <div className="relative z-10 mt-6">
        <label className="ob-field-label" htmlFor="club-name">
          نامِ باشگاه
        </label>
        <input
          id="club-name"
          value={name}
          onChange={(e) => onName(e.target.value)}
          maxLength={20}
          placeholder="مثلاً: عقاب‌های تهران"
          dir="rtl"
          className="onboarding-input w-full rounded-2xl px-4 py-3 text-right font-bold outline-none"
        />
        <p className="ob-field-hint mt-1.5 text-left tabular-nums">
          {name.length}/۲۰
        </p>
      </div>

      <div className="relative z-10 mt-5">
        <p className="ob-field-label">رنگِ باشگاه</p>
        <div className="ob-color-row">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onColor(c)}
              className={`ob-color-swatch ${
                color === c ? "ob-color-swatch--active" : ""
              }`}
              style={{ background: c }}
              aria-label={`رنگ ${c}`}
              aria-pressed={color === c}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-5">
        <p className="ob-field-label">نشان / لوگو</p>
        <div className="ob-crest-scroll">
          {CRESTS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onCrest(c)}
              className={`ob-crest-btn ${
                crest === c ? "ob-crest-btn--active" : ""
              }`}
              aria-label={`نشان ${c}`}
              aria-pressed={crest === c}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-3" />

      <div className="relative z-10 ob-footer">
        <button
          type="button"
          onClick={onContinue}
          className="btn-gold w-full rounded-2xl py-4 text-lg font-extrabold active:scale-[0.98] transition-transform"
        >
          ادامه ←
        </button>
      </div>
    </div>
  );
}

export function Onboarding({ onDone }: OnboardingProps) {
  const completeSetup = useGame((s) => s.completeSetup);

  const [step, setStep] = useState<OnboardingPhase>("story");
  const [storyBeat, setStoryBeat] = useState(0);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(COLORS[0]);
  const [crest, setCrest] = useState(CRESTS[0]);
  const [heartTeam, setHeartTeam] = useState<string | undefined>();
  const [city, setCity] = useState<string | undefined>();

  function finish(prefs?: { heartTeam?: string; city?: string }) {
    const club: ClubIdentity = {
      name: name.trim() || "باشگاهِ من",
      color,
      crest,
      city: prefs?.city ?? city,
      heartTeam: prefs?.heartTeam ?? heartTeam,
    };
    completeSetup(club);
    onDone();
  }

  function advanceStory() {
    if (storyBeat < STORY_BEATS - 1) {
      setStoryBeat((b) => b + 1);
    } else {
      setStep("setup");
    }
  }

  if (step === "story") {
    return <StoryIntro beat={storyBeat} onNext={advanceStory} />;
  }

  if (step === "prefs") {
    return (
      <OnboardingPrefs
        heartTeam={heartTeam}
        city={city}
        onHeartTeam={setHeartTeam}
        onCity={setCity}
        onSkip={() => finish({ heartTeam: undefined, city: undefined })}
        onContinue={() => finish()}
      />
    );
  }

  return (
    <OnboardingSetup
      name={name}
      color={color}
      crest={crest}
      onName={setName}
      onColor={setColor}
      onCrest={setCrest}
      onContinue={() => setStep("prefs")}
    />
  );
}
