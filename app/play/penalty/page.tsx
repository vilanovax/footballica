import { redirect } from "next/navigation";
import { PenaltyMatch } from "@/components/quiz/PenaltyMatch";
import { PenaltyCategoryPicker } from "@/components/quiz/PenaltyCategoryPicker";
import { ExhaustedBlocker } from "@/components/quiz/ExhaustedBlocker";
import { getClubSnapshot, getCurrentUser } from "@/lib/player/current";
import { getMatchQuestions } from "@/actions/getMatchQuestions";
import { listPenaltyCategories } from "@/actions/match/listPenaltyCategories";
import { getGameConfig } from "@/lib/game/gameConfig";
import { prisma } from "@/lib/prisma";

// Reads live (regenerated) stamina before allowing a match — never prerender.
export const dynamic = "force-dynamic";

export default async function PenaltyPage({
  searchParams,
}: {
  searchParams: Promise<{
    tutorial?: string;
    category?: string;
    random?: string;
  }>;
}) {
  const { tutorial, category: categoryRaw, random: randomRaw } =
    await searchParams;
  const isTutorial = tutorial === "true";
  const wantRandom =
    randomRaw === "1" || randomRaw === "true" || randomRaw === "all";
  const categoryId =
    typeof categoryRaw === "string" && categoryRaw.trim()
      ? categoryRaw.trim()
      : null;

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.club) redirect("/onboarding");

  const [club, config] = await Promise.all([
    getClubSnapshot(),
    getGameConfig(),
  ]);
  if (!club) redirect("/onboarding");

  // Gate: block entry when exhausted — but the FTUE tutorial is stamina-free.
  if (!isTutorial && club.stamina <= 0) {
    return <ExhaustedBlocker />;
  }

  const matchSize = isTutorial
    ? config.match.tutorialQuestionCount
    : config.match.questionCount;
  const benchSize = isTutorial ? 0 : 3;

  // Tutorial skips the lobby — short easy shootout from the full bank.
  if (isTutorial) {
    const drawn = await getMatchQuestions({
      count: matchSize,
      difficulties: ["easy"],
    });
    if (drawn.length === 0) return <EmptyBank />;
    return (
      <PenaltyMatch
        tutorial
        initialQuestions={drawn}
        bench={[]}
        matchSize={matchSize}
        startingCoins={club.coins}
        helpers={config.helpers}
        stadiumLevel={club.stadiumLevel}
        fansPerGoal={config.rewards.fansPerGoal}
        categoryId={null}
      />
    );
  }

  // Lobby: pick Random or a category before spending the match feel.
  if (!wantRandom && !categoryId) {
    const listed = await listPenaltyCategories();
    if (!listed.ok) redirect("/login");
    return (
      <PenaltyCategoryPicker
        categories={listed.categories}
        questionCount={listed.questionCount}
        staminaCost={1}
      />
    );
  }

  // Validate category still eligible (active + enough depth).
  if (categoryId) {
    const cat = await prisma.category.findFirst({
      where: { id: categoryId, isActive: true, challengeOnly: false },
      select: { id: true },
    });
    if (!cat) redirect("/play/penalty");
  }

  const drawn = await getMatchQuestions({
    count: matchSize + benchSize,
    categoryId: wantRandom ? null : categoryId,
  });
  const initialQuestions = drawn.slice(0, matchSize);
  const bench = drawn.slice(matchSize);

  if (initialQuestions.length === 0) {
    return <EmptyBank />;
  }

  return (
    <PenaltyMatch
      initialQuestions={initialQuestions}
      bench={bench}
      matchSize={matchSize}
      startingCoins={club.coins}
      helpers={config.helpers}
      stadiumLevel={club.stadiumLevel}
      fansPerGoal={config.rewards.fansPerGoal}
      categoryId={wantRandom ? null : categoryId}
    />
  );
}

function EmptyBank() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="text-6xl" aria-hidden>
        🗒️
      </div>
      <p className="max-w-xs font-display text-lg font-bold text-muted-foreground">
        No questions available yet. Seed the question bank to play.
      </p>
    </section>
  );
}
