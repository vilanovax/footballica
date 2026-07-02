"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useGame, type ClubIdentity } from "@/lib/store";

interface OnboardingProps {
  onDone: () => void;
}

const COLORS = ["#2f6fed", "#e5473f", "#2f9e5f", "#8b3fe0", "#e08a2f", "#111827"];
const CRESTS = ["🦅", "🦁", "🐺", "🐉", "⚽", "🛡️", "⭐", "🔥"];

export function Onboarding({ onDone }: OnboardingProps) {
  const completeSetup = useGame((s) => s.completeSetup);

  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [crest, setCrest] = useState(CRESTS[0]);

  function finish() {
    const club: ClubIdentity = {
      name: name.trim() || "باشگاهِ من",
      color,
      crest,
    };
    completeSetup(club);
    onDone();
  }

  // ---------- گام ۰: روایت ----------
  if (step === 0) {
    return (
      <div className="pitch-stripes min-h-dvh flex flex-col justify-between px-6 py-10">
        <div className="text-center pt-6">
          <div className="text-7xl animate-pop">🏟️</div>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight">
            یک باشگاه، از خاک
          </h1>
        </div>

        <div className="glass rounded-3xl p-5 text-right leading-8 text-white/80">
          تو با <b className="text-white">آخرین پولت</b> یک باشگاهِ قدیمی و ارزان
          در <b className="text-gold-400">دستهٔ سه</b> می‌خری. ورزشگاه
          نیمه‌خراب است، تیم اسپانسر ندارد، هوادارها ناامیدند.
          <br />
          اما تو یک چیز داری:{" "}
          <b className="text-grass-400">دانشِ فوتبالی‌ات</b>. هر جوابِ درست،
          باشگاه را یک قدم به قهرمانی نزدیک‌تر می‌کند.
        </div>

        {/* کارتِ معاملهٔ باشگاه */}
        <div className="rounded-3xl bg-[#eef3ee] text-pitch-900 p-4 flex items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-black/10 text-3xl">
            🏚️
          </div>
          <div className="flex-1 text-right">
            <p className="font-extrabold">باشگاهِ دستهٔ سه</p>
            <p className="text-sm text-pitch-800/70">
              ورشکسته · هوادارِ کم · فرصتِ بزرگ
            </p>
          </div>
          <span className="rounded-xl bg-gold-400 px-3 py-2 text-sm font-extrabold text-[#3a2600]">
            ۸۴۰ 🪙
          </span>
        </div>

        <button
          onClick={() => setStep(1)}
          className="btn-gold w-full rounded-2xl py-4 text-xl font-extrabold"
        >
          قبول می‌کنم، مالِ من است
        </button>
      </div>
    );
  }

  // ---------- گام ۱: ساختِ باشگاه ----------
  return (
    <div className="pitch-stripes min-h-dvh flex flex-col px-6 py-8">
      <h1 className="text-2xl font-extrabold text-center">باشگاهت را بساز</h1>
      <p className="mt-1 text-center text-sm text-white/55">
        اسم، رنگ و لوگو را خودت انتخاب کن
      </p>

      {/* پیش‌نمایش زنده */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <Avatar label={crest} color={color} size={96} />
        <p className="text-xl font-extrabold">{name.trim() || "باشگاهِ من"}</p>
        <span className="rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-sm font-bold text-gold-400">
          🏆 دستهٔ سه · تازه‌تأسیس
        </span>
      </div>

      {/* نام */}
      <label className="mt-7 block text-right text-sm font-bold text-white/70">
        نامِ باشگاه
      </label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={20}
        placeholder="مثلاً: عقاب‌های تهران"
        dir="rtl"
        className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-right font-bold outline-none ring-1 ring-white/10 focus:ring-gold-400 placeholder:text-white/30"
      />

      {/* رنگ */}
      <p className="mt-5 text-right text-sm font-bold text-white/70">رنگِ باشگاه</p>
      <div className="mt-2 flex justify-end gap-3">
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

      {/* لوگو */}
      <p className="mt-5 text-right text-sm font-bold text-white/70">لوگو</p>
      <div className="mt-2 grid grid-cols-8 gap-2">
        {CRESTS.map((c) => (
          <button
            key={c}
            onClick={() => setCrest(c)}
            className={`grid aspect-square place-items-center rounded-xl text-2xl transition ${
              crest === c ? "bg-gold-400" : "bg-white/10"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <button
        onClick={finish}
        className="btn-gold w-full rounded-2xl py-4 text-xl font-extrabold mt-6"
      >
        شروعِ مسیرِ قهرمانی
      </button>
    </div>
  );
}
