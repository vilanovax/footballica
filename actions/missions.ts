"use server";

import { revalidatePath } from "next/cache";
import { requireUserClub } from "@/lib/player/current";
import { prisma } from "@/lib/prisma";
import {
  claimMissionChest,
  claimMissionReward,
  getMissionBoardState,
  reopenLegacyAutoClaims,
  syncOpenDuelMissionCredits,
  type EvaluateMissionsResult,
} from "@/lib/game/missionEngine";

export async function getMyMissions(opts?: {
  /**
   * Skip duel turn backfill — hub first paint / secondary stream.
   * MissionDrawer still calls without this flag so sync runs on open.
   */
  skipDuelSync?: boolean;
}): Promise<
  | { ok: true; board: EvaluateMissionsResult; daily: EvaluateMissionsResult }
  | { ok: false; error: "not_authenticated" | "server_error" }
> {
  const pair = await requireUserClub();
  if (!pair) return { ok: false, error: "not_authenticated" };
  try {
    const sync = opts?.skipDuelSync
      ? Promise.resolve()
      : syncOpenDuelMissionCredits(pair.user.id, prisma);
    // One-time UX reopen: old engine auto-stamped claim on complete.
    // Overlap with duel sync when both run.
    await Promise.all([sync, reopenLegacyAutoClaims(pair.club.id, prisma)]);
    const [board, daily] = await Promise.all([
      getMissionBoardState(pair.club.id, prisma, "CAMPAIGN"),
      getMissionBoardState(pair.club.id, prisma, "DAILY"),
    ]);
    return { ok: true, board, daily };
  } catch (err) {
    console.error("getMyMissions", err);
    return { ok: false, error: "server_error" };
  }
}

export async function claimMyMissionReward(
  missionId: string,
): Promise<
  | {
      ok: true;
      coins: number;
      xp: number;
      balances: { coins: number; xp: number };
      missionId: string;
    }
  | { ok: false; error: string }
> {
  const pair = await requireUserClub();
  if (!pair) return { ok: false, error: "not_authenticated" };
  if (!missionId || typeof missionId !== "string") {
    return { ok: false, error: "not_found" };
  }

  const res = await claimMissionReward(pair.club.id, missionId);
  if (res.ok) {
    revalidatePath("/club");
    revalidatePath("/profile");
  }
  return res;
}

export async function claimMyMissionChest(
  batchId?: string,
): Promise<
  | {
      ok: true;
      coins: number;
      xp: number;
      nextBatchIndex: number | null;
      balances: { coins: number; xp: number };
    }
  | { ok: false; error: string }
> {
  const pair = await requireUserClub();
  if (!pair) return { ok: false, error: "not_authenticated" };

  const res = await claimMissionChest(pair.club.id, batchId);
  if (res.ok) {
    revalidatePath("/club");
    revalidatePath("/profile");
  }
  return res;
}
