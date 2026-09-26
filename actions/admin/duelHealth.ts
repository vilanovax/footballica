"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/admin/auth";
import { getGameConfig } from "@/lib/game/gameConfig";

export type DuelAbandonerRow = {
  userId: string;
  displayName: string;
  clubName: string | null;
  timeouts: number;
};

export type DuelHealthReport = {
  windowDays: number;
  turnHours: number;
  timeoutAction: "AUTO_FORFEIT" | "SHADOW_BOT";
  /** Mean hours between attack submit → defense submit (completed halves). */
  avgHalfGapHours: number | null;
  /** Mean hours between R1 defense submit → R2 attack submit. */
  avgBetweenRoundsHours: number | null;
  sampleHalfGaps: number;
  sampleBetweenRounds: number;
  /** Matches finished with timeoutUserId set in the window. */
  timeoutFinishes: number;
  /** Distinct humans who timed out (abandoned) in the window. */
  abandonerCount: number;
  topAbandoners: DuelAbandonerRow[];
  /** Active duels waiting on a human past the turn deadline. */
  overdueHumanTurns: number;
  /** Active bot-opponent duels stuck without a due botPlayAt schedule. */
  stuckBotTurns: number;
  activeOpen: number;
};

async function assertAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

/**
 * Live-Ops duel health — turn latency + AFK / abandon signal.
 * Pure reads; no mutations.
 */
export async function getDuelHealthReport(
  windowDays = 30,
): Promise<DuelHealthReport | { ok: false; error: string }> {
  if (!(await assertAdmin())) return { ok: false, error: "Unauthorized." };

  const days = Math.min(90, Math.max(7, Math.round(windowDays)));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const now = new Date();
  const config = await getGameConfig();

  const rounds = await prisma.duelRound.findMany({
    where: {
      OR: [
        { attackSubmittedAt: { gte: since } },
        { defenseSubmittedAt: { gte: since } },
      ],
    },
    select: {
      duelId: true,
      roundNumber: true,
      attackSubmittedAt: true,
      defenseSubmittedAt: true,
    },
    take: 5_000,
    orderBy: { updatedAt: "desc" },
  });

  const halfGapsMs: number[] = [];
  for (const r of rounds) {
    if (r.attackSubmittedAt && r.defenseSubmittedAt) {
      const ms =
        r.defenseSubmittedAt.getTime() - r.attackSubmittedAt.getTime();
      if (ms > 0 && ms < 14 * 24 * 60 * 60 * 1000) halfGapsMs.push(ms);
    }
  }

  // Pair R1 defense → R2 attack for between-round latency.
  const byDuel = new Map<string, typeof rounds>();
  for (const r of rounds) {
    const list = byDuel.get(r.duelId) ?? [];
    list.push(r);
    byDuel.set(r.duelId, list);
  }
  const betweenMs: number[] = [];
  for (const list of byDuel.values()) {
    const r1 = list.find((x) => x.roundNumber === 1);
    const r2 = list.find((x) => x.roundNumber === 2);
    if (r1?.defenseSubmittedAt && r2?.attackSubmittedAt) {
      const ms =
        r2.attackSubmittedAt.getTime() - r1.defenseSubmittedAt.getTime();
      if (ms > 0 && ms < 14 * 24 * 60 * 60 * 1000) betweenMs.push(ms);
    }
  }

  const meanHours = (ms: number[]) =>
    ms.length === 0
      ? null
      : ms.reduce((a, b) => a + b, 0) / ms.length / (60 * 60 * 1000);

  const timedOut = await prisma.duelMatch.findMany({
    where: {
      finishedAt: { gte: since },
      timeoutUserId: { not: null },
    },
    select: { timeoutUserId: true },
  });

  const abandonCounts = new Map<string, number>();
  for (const row of timedOut) {
    if (!row.timeoutUserId) continue;
    abandonCounts.set(
      row.timeoutUserId,
      (abandonCounts.get(row.timeoutUserId) ?? 0) + 1,
    );
  }
  const topIds = [...abandonCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const users =
    topIds.length === 0
      ? []
      : await prisma.user.findMany({
          where: { id: { in: topIds.map(([id]) => id) } },
          select: {
            id: true,
            displayName: true,
            club: { select: { name: true } },
          },
        });
  const userById = new Map(users.map((u) => [u.id, u]));

  const topAbandoners: DuelAbandonerRow[] = topIds.map(([userId, timeouts]) => {
    const u = userById.get(userId);
    return {
      userId,
      displayName: u?.displayName ?? userId.slice(0, 8),
      clubName: u?.club?.name ?? null,
      timeouts,
    };
  });

  const [overdueHumanTurns, stuckBotTurns, activeOpen] = await Promise.all([
    prisma.duelMatch.count({
      where: {
        status: {
          in: [
            "A_ATTACKING",
            "WAITING_B",
            "B_DEFENDING",
            "B_ATTACKING",
            "WAITING_A",
            "A_DEFENDING",
          ],
        },
        turnDeadlineAt: { lte: now },
        isBotOpponent: false,
      },
    }),
    prisma.duelMatch.count({
      where: {
        isBotOpponent: true,
        status: { in: ["WAITING_B", "B_DEFENDING", "B_ATTACKING"] },
        OR: [
          { botPlayAt: null },
          { botPlayAt: { lte: new Date(now.getTime() - 30 * 60 * 1000) } },
        ],
      },
    }),
    prisma.duelMatch.count({
      where: {
        status: {
          in: [
            "MATCHING",
            "A_ATTACKING",
            "WAITING_B",
            "B_DEFENDING",
            "B_ATTACKING",
            "WAITING_A",
            "A_DEFENDING",
          ],
        },
      },
    }),
  ]);

  return {
    windowDays: days,
    turnHours: config.duel.turnHours,
    timeoutAction: config.duel.timeoutAction,
    avgHalfGapHours: meanHours(halfGapsMs),
    avgBetweenRoundsHours: meanHours(betweenMs),
    sampleHalfGaps: halfGapsMs.length,
    sampleBetweenRounds: betweenMs.length,
    timeoutFinishes: timedOut.length,
    abandonerCount: abandonCounts.size,
    topAbandoners,
    overdueHumanTurns,
    stuckBotTurns,
    activeOpen,
  };
}
