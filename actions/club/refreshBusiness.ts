"use server";

import {
  getClubSnapshot,
  type ClubSnapshotOptions,
} from "@/lib/player/current";
import type { ClubSnapshot } from "@/lib/club/upgrades";

export type RefreshClubBusinessResult =
  | { ok: true; club: ClubSnapshot }
  | { ok: false; error: "not_authenticated" | "server_error" };

/**
 * Full business settle for the Manage sheet after a hub fast-path load
 * (`getClubSnapshot({ settleBusiness: false })`).
 */
export async function refreshClubBusiness(): Promise<RefreshClubBusinessResult> {
  try {
    const opts: ClubSnapshotOptions = { settleBusiness: true };
    const club = await getClubSnapshot(opts);
    if (!club) return { ok: false, error: "not_authenticated" };
    return { ok: true, club };
  } catch (err) {
    console.error("refreshClubBusiness", err);
    return { ok: false, error: "server_error" };
  }
}
