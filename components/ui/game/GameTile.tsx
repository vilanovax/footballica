import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export type GameTileTone = "default" | "emerald" | "amber" | "sky" | "rose";

type GameTileProps = ComponentPropsWithoutRef<"div"> & {
  tone?: GameTileTone;
};

const TONE: Record<GameTileTone, string> = {
  default: "game-tile",
  emerald: "game-tile game-tile-emerald",
  amber: "game-tile game-tile-amber",
  sky: "game-tile game-tile-sky",
  rose: "game-tile game-tile-rose",
};

/** List row / stat tile inside arena sheets. */
export function GameTile({
  tone = "default",
  className,
  children,
  ...rest
}: GameTileProps) {
  return (
    <div className={cn(TONE[tone], className)} {...rest}>
      {children}
    </div>
  );
}
