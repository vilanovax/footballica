interface AvatarProps {
  label: string;
  color: "you" | "foe" | string;
  size?: number;
  crown?: boolean;
  className?: string;
}

const COLORS: Record<string, string> = {
  you: "var(--color-team-you)",
  foe: "var(--color-team-foe)",
};

export function Avatar({ label, color, size = 56, crown, className }: AvatarProps) {
  const bg = COLORS[color] ?? color;
  return (
    <div className={`relative ${className ?? ""}`} style={{ width: size, height: size }}>
      {crown && (
        <span
          className="absolute left-1/2 -translate-x-1/2 -top-3 text-xl"
          aria-hidden
        >
          👑
        </span>
      )}
      <div
        className="avatar w-full h-full text-white"
        style={{
          background: `linear-gradient(160deg, ${bg}, color-mix(in srgb, ${bg} 70%, #000))`,
          fontSize: size * 0.34,
        }}
      >
        {label}
      </div>
    </div>
  );
}
