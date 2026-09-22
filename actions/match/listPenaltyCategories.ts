"use server";

import { requireUserClub } from "@/lib/player/current";
import { getGameConfig } from "@/lib/game/gameConfig";
import { listEligibleCategories } from "@/lib/quiz/categoryDraw";
import type { CategoryOption } from "@/lib/quiz/categoryDraw";

export type ListPenaltyCategoriesResult =
  | {
      ok: true;
      categories: CategoryOption[];
      /** Kicks in a full Penalty shootout (Live-Ops tunable). */
      questionCount: number;
    }
  | { ok: false; error: "not_authenticated" };

/**
 * Public banks deep enough for one Penalty match (match.questionCount).
 */
export async function listPenaltyCategories(): Promise<ListPenaltyCategoriesResult> {
  const pair = await requireUserClub();
  if (!pair) return { ok: false, error: "not_authenticated" };

  const config = await getGameConfig();
  const questionCount = config.match.questionCount;
  const categories = await listEligibleCategories(questionCount);
  return { ok: true, categories, questionCount };
}
