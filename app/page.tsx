"use client";

import { useEffect, useState } from "react";
import { Onboarding } from "@/components/screens/Onboarding";
import { useGame } from "@/lib/store";
import { Home } from "@/components/screens/Home";
import { Games } from "@/components/screens/Games";
import { Leaderboard } from "@/components/screens/Leaderboard";
import { Shop } from "@/components/screens/Shop";
import { Profile } from "@/components/screens/Profile";
import { Quiz } from "@/components/screens/Quiz";
import { Result } from "@/components/screens/Result";
import { Club } from "@/components/screens/Club";
import { BombMode } from "@/components/screens/BombMode";
import { Duel } from "@/components/screens/Duel";
import { Penalty } from "@/components/screens/Penalty";
import { Survival } from "@/components/screens/Survival";
import { BottomNav } from "@/components/ui/BottomNav";
import { NoLivesModal } from "@/components/ui/NoLivesModal";
import { isTab, type MatchResult, type Screen } from "@/lib/types";

export default function Page() {
  const [screen, setScreen] = useState<Screen>("home");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [clubFrom, setClubFrom] = useState<Screen>("home");
  const [mounted, setMounted] = useState(false);
  const [noLives, setNoLives] = useState(false);
  const setupDone = useGame((s) => s.setupDone);
  const lives = useGame((s) => s.lives);
  const livesUpdatedAt = useGame((s) => s.livesUpdatedAt);
  const syncLives = useGame((s) => s.syncLives);

  useEffect(() => {
    void Promise.resolve(useGame.persist.rehydrate()).then(() => {
      useGame.getState().syncLives();
      useGame.getState().syncClubEconomy();
      setMounted(true);
    });
  }, []);

  const openClub = (from: Screen) => {
    setClubFrom(from);
    setScreen("club");
  };

  function startQuiz() {
    setScreen("quiz");
  }

  function startDuel() {
    syncLives();
    if (!useGame.getState().spendLife()) {
      setNoLives(true);
      return;
    }
    setScreen("duel");
  }

  if (!mounted) return <div className="pitch-stripes min-h-dvh" />;

  if (!setupDone) {
    return <Onboarding onDone={() => setScreen("home")} />;
  }

  return (
    <>
      {screen === "home" && (
        <Home
          onPlayQuick={startQuiz}
          onOpenClub={() => openClub("home")}
          onPlayBomb={() => setScreen("bomb")}
          onOpenGames={() => setScreen("games")}
          onPlayDuel={startDuel}
          onPlayPenalty={() => setScreen("penalty")}
          onPlaySurvival={() => setScreen("survival")}
        />
      )}

      {screen === "games" && (
        <Games
          onPlayQuick={startQuiz}
          onPlayBomb={() => setScreen("bomb")}
          onPlayDuel={startDuel}
          onPlayPenalty={() => setScreen("penalty")}
          onPlaySurvival={() => setScreen("survival")}
        />
      )}

      {screen === "leaderboard" && <Leaderboard />}

      {screen === "shop" && <Shop />}

      {screen === "profile" && (
        <Profile onOpenClub={() => openClub("profile")} />
      )}

      {screen === "club" && <Club onBack={() => setScreen(clubFrom)} />}

      {screen === "bomb" && <BombMode onExit={() => setScreen("home")} />}

      {screen === "penalty" && <Penalty onExit={() => setScreen("home")} />}

      {screen === "survival" && <Survival onExit={() => setScreen("home")} />}

      {screen === "duel" && (
        <Duel
          onFinish={(r) => {
            setResult(r);
            setScreen("result");
          }}
          onExit={() => setScreen("home")}
        />
      )}

      {screen === "quiz" && (
        <Quiz
          onFinish={(r) => {
            setResult(r);
            setScreen("result");
          }}
        />
      )}

      {screen === "result" && result && (
        <Result
          result={result}
          onHome={() => setScreen("home")}
          onOpenClub={() => openClub("result")}
          onReplay={() => {
            if (result.mode === "duel") startDuel();
            else startQuiz();
          }}
        />
      )}

      {noLives && (
        <NoLivesModal
          lives={lives}
          livesUpdatedAt={livesUpdatedAt}
          onClose={() => {
            syncLives();
            setNoLives(false);
          }}
        />
      )}

      {isTab(screen) && <BottomNav active={screen} onNavigate={setScreen} />}
    </>
  );
}
