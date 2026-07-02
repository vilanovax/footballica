"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export type Reaction = "goal" | "supergoal" | "pass" | "counter" | "card";

interface ReactionOverlayProps {
  reaction: Reaction;
  onDone: () => void;
}

const CONFIG: Record<
  Reaction,
  { label: string; flash: string; sub?: string }
> = {
  goal: { label: "گُل!", flash: "rgba(47,158,95,0.5)", sub: "پاسخِ سریع و درست" },
  supergoal: { label: "سوپرگل! 🔥", flash: "rgba(245,197,66,0.5)", sub: "استریکِ داغ!" },
  pass: { label: "پاسِ موفق ✔", flash: "rgba(47,158,95,0.3)", sub: "درست، ولی کمی دیر" },
  counter: { label: "ضدحملهٔ حریف!", flash: "rgba(229,71,63,0.45)" },
  card: { label: "کارت زرد! 🟨", flash: "rgba(229,71,63,0.5)", sub: "خطای پرهزینه" },
};

export function ReactionOverlay({ reaction, onDone }: ReactionOverlayProps) {
  const cfg = CONFIG[reaction];

  useEffect(() => {
    if (reaction === "supergoal") {
      confetti({
        particleCount: 60,
        spread: 90,
        startVelocity: 40,
        origin: { y: 0.4 },
        colors: ["#f5c542", "#2f9e5f", "#ffffff", "#ff8a3d"],
      });
    }
    const t = setTimeout(onDone, 1150);
    return () => clearTimeout(t);
  }, [reaction, onDone]);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {/* فلشِ رنگی */}
      <div
        className="overlay-flash absolute inset-0"
        style={{ background: cfg.flash }}
      />

      {/* گل / سوپرگل */}
      {(reaction === "goal" || reaction === "supergoal" || reaction === "pass") && (
        <div className="absolute inset-x-0 top-[26%] flex flex-col items-center">
          <div className="relative h-40 w-56">
            <span className="net-bulge absolute left-1/2 top-0 -translate-x-1/2 text-8xl">
              🥅
            </span>
            <span className="ball-shot absolute left-1/2 top-10 text-5xl">
              {reaction === "supergoal" ? "🔥⚽" : "⚽"}
            </span>
          </div>
          <span
            className="animate-pop text-5xl font-extrabold text-white drop-shadow-lg"
            style={{ animationDelay: "0.35s" }}
          >
            {cfg.label}
          </span>
          {cfg.sub && (
            <span
              className="animate-pop mt-1 text-sm font-bold text-white/80"
              style={{ animationDelay: "0.5s" }}
            >
              {cfg.sub}
            </span>
          )}
        </div>
      )}

      {/* کارت زرد */}
      {reaction === "card" && (
        <div className="absolute inset-x-0 top-[30%] flex flex-col items-center">
          <div
            className="card-flip h-28 w-20 rounded-lg shadow-2xl"
            style={{ background: "linear-gradient(160deg,#f7d13a,#e0a92e)" }}
          />
          <span
            className="animate-pop mt-4 text-4xl font-extrabold text-white drop-shadow"
            style={{ animationDelay: "0.35s" }}
          >
            {cfg.label}
          </span>
          {cfg.sub && (
            <span className="animate-pop mt-1 text-sm font-bold text-white/80" style={{ animationDelay: "0.5s" }}>
              {cfg.sub}
            </span>
          )}
        </div>
      )}

      {/* ضدحمله */}
      {reaction === "counter" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="counter-swipe flex items-center gap-3">
            <span className="text-6xl">💨</span>
            <span className="text-4xl font-extrabold text-team-foe drop-shadow-lg">
              {cfg.label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
