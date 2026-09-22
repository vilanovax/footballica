"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getAvatar, isAvatarKey, type AvatarKey } from "@/lib/onboarding/avatars";
import { getClubColor } from "@/lib/onboarding/clubColors";

type AvatarImageProps = {
  /** Avatar key (Club.avatar / User.managerAvatar). Falls back to the first avatar. */
  avatarKey: string | null | undefined;
  /** Sizing / shape utilities for the wrapper (e.g. "h-20 w-20 rounded-full"). */
  className?: string;
  /** Render as grayscale (locked cosmetics preview). */
  muted?: boolean;
  /** Optional club color key — tints the emoji fallback circle. */
  colorKey?: string | null;
  /** Prefetch for above-the-fold hub / profile heroes. */
  priority?: boolean;
  /**
   * CSS pixel box this avatar is drawn into (e.g. "48px").
   * Used as the 1x intrinsic size so next/image emits a 1x/2x srcset.
   * Do not pass viewport units — a `w` srcset plus `priority` preloads a
   * candidate the img element then ignores.
   */
  sizes?: string;
};

/** Plain `Npx` only. Anything else falls back to the hub default. */
function avatarPx(sizes: string): number {
  const match = /^(\d+)px$/.exec(sizes.trim());
  const px = match ? Number(match[1]) : 96;
  return px > 0 ? px : 96;
}

/**
 * Renders an illustrated manager avatar from /public/avatars. The source PNGs
 * already carry their own circular background, so callers only supply size +
 * radius via `className`. On load error, falls back to catalog emoji.
 * Uses next/image so AVIF/WebP derivatives ship instead of raw ~60–90KB PNGs.
 * Fixed width/height (not fill) so the optimizer emits 1x/2x descriptors.
 * A fill image with a pixel `sizes` value builds a full `w` srcset; Chrome's
 * preload scanner and the img element then pick different candidates, which
 * logs "preloaded but not used" for priority avatars.
 */
export function AvatarImage({
  avatarKey,
  className,
  muted = false,
  colorKey,
  priority = false,
  sizes = "96px",
}: AvatarImageProps) {
  const key: AvatarKey = isAvatarKey(avatarKey ?? "")
    ? (avatarKey as AvatarKey)
    : "TACTICAL_COACH";
  const avatar = getAvatar(key);
  const px = avatarPx(sizes);
  const [failed, setFailed] = useState(false);
  const accent = getClubColor(colorKey);

  if (failed) {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-flex items-center justify-center rounded-full text-[1.35em] leading-none shadow-fantasy-sm",
          muted && "grayscale opacity-70",
          className,
        )}
        style={{
          background: `linear-gradient(145deg, ${accent.washHex}, ${accent.hex})`,
          color: "#fff",
        }}
      >
        {avatar.emoji}
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-block overflow-hidden",
        muted && "grayscale",
        className,
      )}
    >
      <Image
        src={avatar.image}
        alt=""
        width={px}
        height={px}
        priority={priority}
        draggable={false}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </span>
  );
}
