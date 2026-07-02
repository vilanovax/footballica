"use client";

import { useState } from "react";
import { useGame } from "@/lib/store";
import { POWERUPS, powerUpCount } from "@/lib/powerups";
import { faNum } from "@/lib/format";

export function Shop() {
  const cards = useGame((s) => s.cards);
  const powerups = useGame((s) => s.powerups);
  const buyPowerUp = useGame((s) => s.buyPowerUp);

  const [toast, setToast] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);

  function buy(id: (typeof POWERUPS)[number]["id"]) {
    const p = POWERUPS.find((x) => x.id === id)!;
    const res = buyPowerUp(id);
    if (res === "ok") {
      setToast(`«${p.name}» به موجودی اضافه شد ✓`);
      setTimeout(() => setToast(null), 1500);
    } else {
      setShakeId(id);
      setTimeout(() => setShakeId(null), 400);
    }
  }

  return (
    <div className="pitch-stripes min-h-dvh pb-32">
      <header className="px-5 pt-6 flex items-center justify-between">
        <span className="glass rounded-2xl px-3 py-2 text-sm font-extrabold">
          {faNum(cards)} ⚡ کارت تاکتیکی
        </span>
        <h1 className="text-2xl font-extrabold">فروشگاه</h1>
      </header>

      <p className="px-5 mt-4 text-sm text-white/55 text-right leading-6">
        پاورآپ‌ها با <b className="text-gold-400">کارت تاکتیکی ⚡</b> خریده
        می‌شوند — از پنالتی، بمب و مسابقات به دست بیاور.
      </p>

      <h3 className="px-5 mt-6 mb-3 text-xl font-extrabold text-right">
        سوپرپاورها
      </h3>
      <div className="px-5 grid grid-cols-2 gap-3">
        {POWERUPS.map((p) => {
          const owned = powerUpCount(powerups, p.id);
          const enough = cards >= p.price;
          return (
            <button
              key={p.id}
              onClick={() => buy(p.id)}
              className={`glass rounded-2xl p-3 text-right flex flex-col gap-1 active:scale-[0.97] transition ${
                shakeId === p.id ? "animate-shake" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{p.emoji}</span>
                {owned > 0 && (
                  <span className="rounded-lg bg-grass-500/20 px-2 py-0.5 text-xs font-bold text-grass-400">
                    ×{faNum(owned)}
                  </span>
                )}
              </div>
              <span className="font-extrabold">{p.name}</span>
              <span className="text-xs text-white/55 leading-5">{p.desc}</span>
              <span
                className={`mt-1 self-start rounded-lg px-2.5 py-1 text-sm font-extrabold ${
                  enough
                    ? "bg-gold-400 text-[#3a2600]"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {faNum(p.price)} ⚡
              </span>
            </button>
          );
        })}
      </div>

      <h3 className="px-5 mt-7 mb-3 text-xl font-extrabold text-right">
        بسته‌ها و اشتراک
      </h3>
      <div className="px-5 space-y-3">
        {[
          {
            id: "c1",
            title: "۵ کارت تاکتیکی",
            sub: "شروعِ خوب",
            emoji: "⚡",
            toman: 9000,
          },
          {
            id: "c2",
            title: "۲۰ کارت تاکتیکی",
            sub: "پرطرفدار",
            emoji: "⚡",
            toman: 49000,
            highlight: true,
          },
          {
            id: "noads",
            title: "حذفِ تبلیغ",
            sub: "یک‌بار خرید، برای همیشه",
            emoji: "🚫",
            toman: 39000,
          },
          {
            id: "pass",
            title: "بلیتِ فصلی",
            sub: "جایزهٔ پلکانیِ فصل",
            emoji: "🎟️",
            toman: 79000,
            highlight: true,
          },
        ].map((p) => (
          <div
            key={p.id}
            className={`rounded-2xl p-4 flex items-center gap-3 ${
              p.highlight
                ? "bg-gradient-to-l from-gold-500/25 to-transparent ring-1 ring-gold-500/40"
                : "glass"
            }`}
          >
            <button className="btn-gold rounded-xl px-4 py-2.5 text-sm font-extrabold">
              {faNum(p.toman)} تومان
            </button>
            <div className="flex-1 text-right">
              <p className="font-extrabold">
                {p.title}
                {p.highlight && (
                  <span className="mr-2 rounded-md bg-gold-400 px-1.5 py-0.5 text-[10px] text-[#3a2600]">
                    ویژه
                  </span>
                )}
              </p>
              <p className="text-sm text-white/55">{p.sub}</p>
            </div>
            <span className="text-3xl">{p.emoji}</span>
          </div>
        ))}
        <p className="pt-1 text-center text-xs text-white/40 leading-6">
          خرید با پول واقعی در فاز بعد وصل می‌شود · اصلِ ما: pay-to-skip، نه
          pay-to-win
        </p>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-pop rounded-2xl bg-grass-500 px-5 py-3 font-bold text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
