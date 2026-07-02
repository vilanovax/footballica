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
import { isTab, type MatchResult, type Screen } from "@/lib/types";

export default function Page() {
  const [screen, setScreen] = useState<Screen>("home");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [clubFrom, setClubFrom] = useState<Screen>("home");
  const [mounted, setMounted] = useState(false);
  const setupDone = useGame((s) => s.setupDone);

  // localStorage فقط سمتِ کلاینت است — بعد از rehydrate صفحه را نشان بده
  useEffect(() => {
    useGame.persist.rehydrate();
    setMounted(true);
  }, []);

  const openClub = (from: Screen) => {
    setClubFrom(from);
    setScreen("club");
  };

  if (!mounted) return <div className="pitch-stripes min-h-dvh" />;

  if (!setupDone) {
    return <Onboarding onDone={() => setScreen("home")} />;
  }

  return (
    <>
      {screen === "home" && (
        <Home
          onPlayQuick={() => setScreen("quiz")}
          onOpenClub={() => openClub("home")}
          onPlayBomb={() => setScreen("bomb")}
          onOpenGames={() => setScreen("games")}
          onPlayDuel={() => setScreen("duel")}
          onPlayPenalty={() => setScreen("penalty")}
          onPlaySurvival={() => setScreen("survival")}
        />
      )}

      {screen === "games" && (
        <Games
          onPlayQuick={() => setScreen("quiz")}
          onPlayBomb={() => setScreen("bomb")}
          onPlayDuel={() => setScreen("duel")}
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
          onReplay={() => setScreen(result.mode === "duel" ? "duel" : "quiz")}
        />
      )}

      {/* نوارِ پایین فقط روی تب‌ها، نه در جریانِ بازی */}
      {isTab(screen) && <BottomNav active={screen} onNavigate={setScreen} />}
    </>
  );
}
