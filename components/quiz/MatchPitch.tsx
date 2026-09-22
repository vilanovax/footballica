import { stadiumScene } from "@/lib/club/stadiumScene";

type MatchPitchProps = {
  stadiumLevel: number;
};

/**
 * Live-match ground. The tier is the club's stadium, not a new palette.
 */
export function MatchPitch({ stadiumLevel }: MatchPitchProps) {
  const scene = stadiumScene(stadiumLevel);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className={["absolute inset-0", scene.wash].join(" ")} />
      <div className="game-pinstripe absolute inset-0 opacity-40" />
      <div
        className={[
          "absolute -inset-e-16 top-0 h-48 w-48 rounded-full blur-3xl",
          scene.glow,
        ].join(" ")}
      />
      <div
        className={[
          "absolute -inset-s-20 bottom-16 h-40 w-40 rounded-full blur-3xl",
          scene.orb,
        ].join(" ")}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/stadium.png"
        alt=""
        draggable={false}
        className={[
          "absolute inset-e-3 top-3 h-14 w-14 object-contain opacity-30",
          scene.art,
        ].join(" ")}
      />
    </div>
  );
}
