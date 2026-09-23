"use client";

import type { DuelSnapshot } from "@/lib/duel/snapshot";
import { MatchingSearch } from "./MatchingSearch";
import { DuelSummary } from "./DuelSummary";

type DuelWaitingProps = {
  mode?: "wait" | "matching";
  duel: DuelSnapshot;
  isBot: boolean;
  yourAvatar?: string | null;
  yourName?: string | null;
  /** Server already assigned opponent; keep showing search until min timer. */
  matchFound?: boolean;
  /** Kept for Arena API compat (auto-poll lives in DuelArena). */
  pending?: boolean;
  onRefresh?: () => void;
};

/**
 * Wait / matching bridge — denser Arena surfaces for both modes.
 */
export function DuelWaiting({
  mode = "wait",
  duel,
  isBot,
  yourAvatar,
  yourName,
  matchFound = false,
}: DuelWaitingProps) {
  if (mode === "matching") {
    return (
      <MatchingSearch
        yourAvatar={yourAvatar}
        yourName={yourName}
        found={matchFound}
        foundIsBot={isBot}
      />
    );
  }

  return (
    <DuelSummary duel={duel} yourAvatar={yourAvatar} yourName={yourName} />
  );
}
