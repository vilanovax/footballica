import type { GamePanelTone } from "@/components/ui/game/GamePanel";

export type StadiumScene = {
  index: number;
  tone: GamePanelTone;
  /** Ambient orb on the stadium hero and the match pitch. */
  glow: string;
  /** Filter treatment for the stadium PNG. */
  art: string;
  /** Bottom band on the hub stadium card. */
  pitch: string;
  /** Full-bleed wash behind a live match. */
  wash: string;
  /** Second orb so the match wash is not a flat tint. */
  orb: string;
};

const SCENES: readonly Omit<StadiumScene, "index">[] = [
  {
    tone: "emerald",
    glow: "bg-stone-400/20",
    art: "grayscale brightness-75 contrast-110",
    pitch: "bg-linear-to-b from-stone-500/80 to-arena",
    wash: "bg-linear-to-b from-stone-800 via-arena to-arena-mid",
    orb: "bg-stone-400/20",
  },
  {
    tone: "amber",
    glow: "bg-amber-400/25",
    art: "sepia-[.35] brightness-90 contrast-105",
    pitch: "bg-linear-to-b from-arena-amber/70 to-arena-mid",
    wash: "bg-linear-to-b from-amber-950 via-arena to-arena-mid",
    orb: "bg-amber-400/20",
  },
  {
    tone: "emerald",
    glow: "bg-emerald-400/30",
    art: "brightness-100 saturate-110",
    pitch: "bg-linear-to-b from-arena-success to-arena",
    wash: "bg-linear-to-b from-emerald-950 via-arena to-arena-mid",
    orb: "bg-emerald-400/25",
  },
  {
    tone: "sky",
    glow: "bg-sky-300/35",
    art: "brightness-110 saturate-125 drop-shadow-[0_0_18px_rgba(125,211,252,0.45)]",
    pitch: "bg-linear-to-b from-arena-success to-arena",
    wash: "bg-linear-to-b from-sky-950 via-arena to-arena-mid",
    orb: "bg-sky-300/25",
  },
];

/** Hub stadium card and live-match pitch share one tier ladder. */
export function stadiumScene(level: number): StadiumScene {
  const index = Math.min(Math.max(0, level), SCENES.length - 1);
  return { index, ...SCENES[index]! };
}
