"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useGame, type ClubIdentity } from "@/lib/store";
import { CITIES, HEART_TEAMS, type IdentityOption } from "@/lib/playerIdentity";

interface OnboardingProps {
  onDone: () => void;
}

const COLORS = ["#2f6fed", "#e5473f", "#2f9e5f", "#8b3fe0", "#e08a2f", "#111827"];
const CRESTS = ["🦅", "🦁", "🐺", "🐉", "⚽", "🛡️", "⭐", "🔥"];

const STORY_BEATS = 3;

function PrefsChipGrid({
  options,
  value,
  onChange,
}: {
  options: IdentityOption[];
  value?: string;
  onChange: (id: string | undefined) => void;
}) {
  return (
    <div className="identity-chip-grid identity-chip-grid--compact">
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
  return (
    <div className="onboarding-setup pitch-stripes min-h-dvh flex flex-col px-5 py-8">
      <p className="text-center text-[11px] font-bold text-gold-400/80">
        فصل ۱ · شخصی‌سازی
      </p>
      <h1 className="mt-2 text-2xl font-extrabold text-center text-white">
        باشگاهت کجاست؟
      </h1>
      <p className="mt-1 text-center text-sm text-white/55 leading-6">
        اختیاری — برای رویدادها و رقابت شهری
      </p>

      <div className="mt-6 space-y-5 flex-1 overflow-y-auto">
        <div>
          <p className="text-right text-sm font-bold text-white/70 mb-2">
            تیم قلبی تو
          </p>
          <PrefsChipGrid
            options={HEART_TEAMS.filter((t) => t.id !== "none_iran")}
            value={heartTeam}
            onChange={onHeartTeam}
          />
        </div>

        <div>
          <p className="text-right text-sm font-bold text-white/70 mb-2">
            شهر باشگاه
          </p>
          <PrefsChipGrid
            options={CITIES.filter((c) => c.id !== "other")}
            value={city}
            onChange={onCity}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <button
          type="button"
          onClick={onContinue}
          className="btn-gold w-full rounded-2xl py-4 text-lg font-extrabold active:scale-[0.98] transition-transform"
        >
          ادامه → اولین بازی
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="w-full rounded-2xl py-3 text-sm font-bold text-white/50"
        >
          بعداً تکمیل می‌کنم
        </button>
      </div>
    </div>
  );
}

function StoryDots({ beat }: { beat: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
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
    { icon: "⚽", label: "کویز", sub: "جواب درست" },
    { icon: "🔐", label: "گاوصندوق", sub: "ذخیرهٔ پول" },
    { icon: "🏟️", label: "باشگاه", sub: "رشد و درآمد" },
  ];

  return (
    <div className="onboarding-flow flex items-stretch justify-between gap-1">
      {steps.map((s, i) => (
        <div key={s.label} className="flex flex-1 items-center gap-1 min-w-0">
          <div className="onboarding-flow-step flex-1 rounded-xl px-2 py-3 text-center">
            <span className="text-xl">{s.icon}</span>
            <p className="mt-1 text-[11px] font-extrabold text-white/90">{s.label}</p>
            <p className="text-[9px] text-white/45">{s.sub}</p>
          </div>
          {i < steps.length - 1 && (
            <span className="onboarding-flow-arrow shrink-0 text-[10px] text-gold-400/70">
              ←
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ContractCard() {
  const rows = [
    { label: "لیگ", value: "دستهٔ سه", accent: true },
    { label: "وضعیت", value: "ورشکسته · هوادارِ کم" },
    { label: "گاوصندوق", value: "خالی — آمادهٔ پر شدن" },
    { label: "هدیهٔ شروع", value: "۲ کارتِ تاکتیکی", accent: true },
  ];

  return (
    <div className="onboarding-contract rounded-3xl overflow-hidden">
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

  return (
    <div className="onboarding-story pitch-stripes min-h-dvh flex flex-col px-5 py-8">
      <div className="onboarding-story-glow pointer-events-none" aria-hidden />

      <div className="relative z-10 flex flex-col flex-1">
        <p className="text-center text-[11px] font-bold tracking-wide text-gold-400/80">
          {beat === 0 && "فصل ۱ · معامله"}
          {beat === 1 && "فصل ۱ · مسیر تو"}
          {beat === 2 && "فصل ۱ · امضا"}
        </p>

        <div key={beat} className="animate-rise flex-1 flex flex-col pt-4">
          {beat === 0 && (
            <>
              <div className="text-center">
                <div className="onboarding-hero-icon mx-auto grid h-24 w-24 place-items-center rounded-3xl text-5xl animate-pop">
                  🏟️
                </div>
                <h1 className="mt-5 text-[1.75rem] font-extrabold leading-tight text-white">
                  یک باشگاه،
                  <br />
                  <span className="text-gold-400">از خاک</span>
                </h1>
              </div>

              <div className="onboarding-story-card mt-6 rounded-3xl p-5 text-right leading-8">
                <p className="text-[15px] text-white/88">
                  تو با{" "}
                  <strong className="text-gold-400">آخرین پولت</strong> یک باشگاهِ
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
                <div className="onboarding-hero-icon mx-auto grid h-24 w-24 place-items-center rounded-3xl text-5xl animate-pop">
                  🧠
                </div>
                <h1 className="mt-5 text-[1.75rem] font-extrabold leading-tight text-white">
                  سلاحِ تو:
                  <br />
                  <span className="text-grass-400">دانشِ فوتبال</span>
                </h1>
              </div>

              <div className="onboarding-story-card mt-6 rounded-3xl p-5 text-right">
                <p className="text-[15px] text-white/88 leading-8">
                  در کویزها جواب بده. هر پاسخِ درست →{" "}
                  <strong className="text-gold-400">پول به گاوصندوق</strong>، XP،
                  هوادار و کارتِ تاکتیکی.
                </p>
                <p className="mt-3 text-sm text-white/65 leading-7">
                  پول را از گاوصندوق بردار، واحدهای باشگاه را ارتقا بده، مدیر
                  استخدام کن — و باشگاه را قدم‌به‌قدم زنده کن.
                </p>
              </div>

              <div className="mt-5">
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

              <div className="onboarding-perks mt-4 grid grid-cols-3 gap-2">
                {[
                  { icon: "🃏", label: "۲ کارت" },
                  { icon: "🏪", label: "فروشگاه" },
                  { icon: "🔐", label: "گاوصندوق" },
                ].map((p) => (
                  <div
                    key={p.label}
                    className="onboarding-perk rounded-xl py-3 text-center"
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

        <div className="relative z-10 mt-auto pt-6 space-y-4">
          <StoryDots beat={beat} />
          <button
            onClick={onNext}
            className="btn-gold w-full rounded-2xl py-4 text-lg font-extrabold active:scale-[0.98] transition-transform"
          >
            {isLast ? "قبول می‌کنم، مالِ من است ✍️" : "ادامه ←"}
          </button>
          {!isLast && (
            <p className="text-center text-[10px] text-white/30">
              {faBeatHint(beat)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function faBeatHint(beat: number): string {
  if (beat === 0) return "بعد: چطور باشگاه را احیا می‌کنی";
  return "بعد: امضای قرارداد";
}

export function Onboarding({ onDone }: OnboardingProps) {
  const completeSetup = useGame((s) => s.completeSetup);

  const [step, setStep] = useState<"story" | "setup" | "prefs">("story");
  const [storyBeat, setStoryBeat] = useState(0);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
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
    <div className="onboarding-setup pitch-stripes min-h-dvh flex flex-col px-5 py-8">
      <p className="text-center text-[11px] font-bold text-gold-400/80">
        فصل ۱ · ساختِ باشگاه
      </p>
      <h1 className="mt-2 text-2xl font-extrabold text-center text-white">
        باشگاهت را بساز
      </h1>
      <p className="mt-1 text-center text-sm text-white/55">
        اسم، رنگ و نشان — اولین قدمِ مالکیت
      </p>

      <div className="onboarding-preview mt-6 flex flex-col items-center gap-3 rounded-3xl py-6">
        <Avatar label={crest} color={color} size={96} />
        <p className="text-xl font-extrabold text-white">
          {name.trim() || "باشگاهِ من"}
        </p>
        <span className="onboarding-badge rounded-lg px-3 py-1 text-sm font-bold text-gold-400">
          🏆 دستهٔ سه · تازه‌تأسیس
        </span>
      </div>

      <label className="mt-7 block text-right text-sm font-bold text-white/70">
        نامِ باشگاه
      </label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={20}
        placeholder="مثلاً: عقاب‌های تهران"
        dir="rtl"
        className="onboarding-input mt-2 w-full rounded-2xl px-4 py-3 text-right font-bold outline-none"
      />

      <p className="mt-5 text-right text-sm font-bold text-white/70">رنگِ باشگاه</p>
      <div className="mt-2 flex justify-end gap-3 flex-wrap">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`h-10 w-10 rounded-full transition ${
              color === c ? "ring-4 ring-white scale-110" : "ring-2 ring-white/20"
            }`}
            style={{ background: c }}
            aria-label={`رنگ ${c}`}
          />
        ))}
      </div>

      <p className="mt-5 text-right text-sm font-bold text-white/70">نشان / لوگو</p>
      <div className="mt-2 grid grid-cols-8 gap-2">
        {CRESTS.map((c) => (
          <button
            key={c}
            onClick={() => setCrest(c)}
            className={`grid aspect-square place-items-center rounded-xl text-2xl transition ${
              crest === c ? "bg-gold-400 scale-105" : "onboarding-crest-btn"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <button
        onClick={() => setStep("prefs")}
        className="btn-gold w-full rounded-2xl py-4 text-xl font-extrabold mt-6 active:scale-[0.98] transition-transform"
      >
        ادامه ←
      </button>
    </div>
  );
}
