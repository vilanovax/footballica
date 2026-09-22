import "server-only";

import { prisma } from "@/lib/prisma";
import type { NearPerfectTip } from "@/lib/play/buildPlaylist";

/**
 * Freshest category-locked Penalty PB that is exactly one goal shy of Perfect.
 * Drives the Play Recommended "near_perfect" chip.
 */
export async function findNearPerfectPenalty(input: {
  clubId: string;
  questionCount: number;
}): Promise<NearPerfectTip | null> {
  const { clubId, questionCount } = input;
  if (questionCount < 2) return null;

  const target = questionCount - 1;

  const row = await prisma.categoryRecord.findFirst({
    where: {
      clubId,
      maxPenaltyGoals: target,
      // Already perfected — no chase left for the Perfect chip.
      perfectPenaltyCount: 0,
      category: {
        isActive: true,
        challengeOnly: false,
      },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      categoryId: true,
      maxPenaltyGoals: true,
      category: {
        select: { nameEn: true, nameFa: true },
      },
    },
  });

  if (!row) return null;

  return {
    categoryId: row.categoryId,
    nameEn: row.category.nameEn,
    nameFa: row.category.nameFa,
    bestGoals: row.maxPenaltyGoals,
    questionCount,
  };
}
