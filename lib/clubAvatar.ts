"use client";

import { useMemo } from "react";
import { useGame } from "./store";
import { clubAvatarColor, clubAvatarLabel } from "./collectibles";

/** لوگو و رنگ نمایشی باشگاه با احتساب cosmeticهای فعال */
export function useClubAvatar() {
  const club = useGame((s) => s.club);
  const equipped = useGame((s) => s.equippedCosmetics);

  return useMemo(
    () => ({
      label: clubAvatarLabel(club, equipped),
      color: clubAvatarColor(club, equipped),
    }),
    [club, equipped],
  );
}
