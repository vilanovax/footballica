import Image from "next/image";

type RankArtKind = "crown" | "gold" | "silver" | "bronze" | "trophy";

const SRC: Record<RankArtKind, string> = {
  crown: "/icons/crown.png",
  gold: "/icons/medal-gold.png",
  silver: "/icons/medal-silver.png",
  bronze: "/icons/medal-bronze.png",
  trophy: "/icons/trophy.png",
};

const SIZE: Record<"sm" | "md" | "lg", { className: string; px: number }> = {
  sm: { className: "h-5 w-5", px: 20 },
  md: { className: "h-7 w-7", px: 28 },
  lg: { className: "h-9 w-9", px: 36 },
};

/** Crown / podium medals for weekly league UI. */
export function RankArt({
  kind,
  size = "md",
  className,
}: {
  kind: RankArtKind;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim = SIZE[size];
  return (
    <Image
      src={SRC[kind]}
      alt=""
      width={dim.px}
      height={dim.px}
      aria-hidden
      draggable={false}
      className={[
        dim.className,
        "shrink-0 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]",
        className ?? "",
      ].join(" ")}
    />
  );
}

export function medalKindForPlace(place: number): "gold" | "silver" | "bronze" {
  if (place === 1) return "gold";
  if (place === 2) return "silver";
  return "bronze";
}
