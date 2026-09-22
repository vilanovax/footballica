import { prisma } from "@/lib/prisma";

export type LastMatchLine = {
  won: boolean;
  coins: number;
  fans: number;
};

/** Newest finished match, for one line under the hub kickoff. */
export async function getLastMatchLine(
  clubId: string,
): Promise<LastMatchLine | null> {
  const row = await prisma.match.findFirst({
    where: { clubId, status: "COMPLETED" },
    orderBy: { finishedAt: "desc" },
    select: {
      goalsFor: true,
      questionsTotal: true,
      coinsEarned: true,
      fansEarned: true,
    },
  });
  if (!row || row.questionsTotal <= 0) return null;
  return {
    won: row.goalsFor > row.questionsTotal / 2,
    coins: row.coinsEarned,
    fans: row.fansEarned,
  };
}
