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
import { Missions } from "@/components/screens/Missions";
import { BottomNav } from "@/components/ui/BottomNav";
import { NoLivesModal } from "@/components/ui/NoLivesModal";
import { isTab, type DuelKind, type MatchResult, type Screen, type Tab } from "@/lib/types";
import type { LeaderboardKind } from "@/lib/communityLeaderboards";

type LeaderboardArenaView = "weekly" | "fairplay";

export default function Page() {
  const [screen, setScreen] = useState<Screen>("home");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [missionsFrom, setMissionsFrom] = useState<Screen>("home");
  const [clubFrom, setClubFrom] = useState<Screen>("home");
  const [mounted, setMounted] = useState(false);
  const [duelKind, setDuelKind] = useState<DuelKind | undefined>(undefined);
  const [duelKey, setDuelKey] = useState(0);
  const [noLives, setNoLives] = useState(false);
  const [profileIdentityOpen, setProfileIdentityOpen] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState<LeaderboardKind | undefined>();
  const [leaderboardArenaView, setLeaderboardArenaView] = useState<
    LeaderboardArenaView | undefined
  >();
  const setupDone = useGame((s) => s.setupDone);
  const lives = useGame((s) => s.lives);
  const livesUpdatedAt = useGame((s) => s.livesUpdatedAt);
  const syncLives = useGame((s) => s.syncLives);
  const playerFocus = useGame((s) => s.playerFocus);

  useEffect(() => {
    void Promise.resolve(useGame.persist.rehydrate()).then(() => {
      useGame.getState().syncLives();
      useGame.getState().syncClubEconomy();
      useGame.getState().ensureDailyMissions();
      setMounted(true);
    });
  }, []);

  const openClub = (from: Screen) => {
    setClubFrom(from);
    setScreen("club");
  };

  const openMissions = (from: Screen) => {
    setMissionsFrom(from);
    setScreen("missions");
  };

  function startQuiz() {
    setScreen("quiz");
  }

  function startDuel(kind?: DuelKind) {
    syncLives();
    if (!useGame.getState().spendLife()) {
      setNoLives(true);
      return;
    }
    setDuelKind(kind);
    setDuelKey((k) => k + 1);
    setScreen("duel");
  }

  function navigateTab(tab: Tab) {
    if (tab === "leaderboard") {
      setLeaderboardTab(undefined);
      setLeaderboardArenaView(undefined);
    }
    setScreen(tab);
  }

  function openFairPlayLeaderboard() {
    setLeaderboardTab("arena");
    setLeaderboardArenaView("fairplay");
    setScreen("leaderboard");
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
          onOpenMissions={() => openMissions("home")}
          onPlayBomb={() => setScreen("bomb")}
          onOpenGames={() => setScreen("games")}
          onPlayDuel={startDuel}
          onPlayPenalty={() => setScreen("penalty")}
          onPlaySurvival={() => setScreen("survival")}
          onOpenFairPlayLeaderboard={openFairPlayLeaderboard}
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

      {screen === "leaderboard" && (
        <Leaderboard
          initialTab={leaderboardTab}
          initialArenaView={leaderboardArenaView}
          onOpenProfile={() => {
            setProfileIdentityOpen(true);
            setScreen("profile");
          }}
        />
      )}

      {screen === "shop" && <Shop />}

      {screen === "profile" && (
        <Profile
          onOpenClub={() => openClub("profile")}
          onOpenMissions={() => openMissions("profile")}
          onOpenShop={() => setScreen("shop")}
          initialIdentityOpen={profileIdentityOpen}
          onIdentityOpenHandled={() => setProfileIdentityOpen(false)}
        />
      )}

      {screen === "missions" && (
        <Missions
          onBack={() => setScreen(missionsFrom)}
          onGoToGames={() => setScreen("games")}
          onGoToClub={() => openClub("missions")}
        />
      )}

      {screen === "club" && (
        <Club
          onBack={clubFrom === "club" ? undefined : () => setScreen(clubFrom)}
          onOpenShop={() => setScreen("shop")}
          onOpenProfile={() => setScreen("profile")}
        />
      )}

      {screen === "bomb" && <BombMode onExit={() => setScreen("home")} />}

      {screen === "penalty" && <Penalty onExit={() => setScreen("home")} />}

      {screen === "survival" && <Survival onExit={() => setScreen("home")} />}

      {screen === "duel" && (
        <Duel
          key={duelKey}
          defaultKind={duelKind}
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
            if (result.mode === "duel") startDuel(result.duelKind);
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

      {(isTab(screen) || (screen === "club" && playerFocus === "club")) && (
        <BottomNav
          active={screen === "club" ? "club" : screen}
          onNavigate={navigateTab}
          onOpenClub={() => openClub("club")}
        />
      )}
    </>
  );
}
