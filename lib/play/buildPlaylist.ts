/**
 * Play-screen Recommended playlist — soft routing, not new modes.
 * Pure helper so the server page and client cards share the same priority rules.
 */

export type PlayPlaylistId =
  | "duel_turn"
  | "live_challenge"
  | "beat_record"
  | "near_perfect"
  | "quick_penalty"
  | "new_duel";

export type NearPerfectTip = {
  categoryId: string;
  nameEn: string;
  nameFa: string;
  bestGoals: number;
  questionCount: number;
};

export type PlayPlaylistItem = {
  id: PlayPlaylistId;
  href: string;
  /** Category tip copy for `near_perfect` (resolved by locale in the UI). */
  meta?: {
    nameEn: string;
    nameFa: string;
    goals: number;
    total: number;
    /** True when chip routes to Club manage (no stamina). */
    needsEnergy?: boolean;
  };
};

export type BuildPlayPlaylistInput = {
  stamina: number;
  inboxCount: number;
  duelHref: string;
  survivalBest: number;
  liveChallengeCount: number;
  /** Category-locked Penalty one goal shy of Perfect (null when none). */
  nearPerfect?: NearPerfectTip | null;
};

/**
 * Up to 3 recommended actions. Priority:
 * 1) Active duel turn
 * 2) Near-perfect Penalty bank (coin→energy→retry loop)
 * 3) Live challenge / Survival beat-record
 * 4) Quick penalty / new duel
 * GotD stays in its own Today slot — never duplicated here.
 */
export function buildPlayPlaylist(
  input: BuildPlayPlaylistInput,
): PlayPlaylistItem[] {
  const {
    stamina,
    inboxCount,
    duelHref,
    survivalBest,
    liveChallengeCount,
    nearPerfect = null,
  } = input;
  const out: PlayPlaylistItem[] = [];

  if (inboxCount > 0) {
    out.push({ id: "duel_turn", href: duelHref });
  }

  if (nearPerfect) {
    const needsEnergy = stamina <= 0;
    const href = needsEnergy
      ? "/club?manage=1"
      : `/play/penalty?category=${encodeURIComponent(nearPerfect.categoryId)}`;
    out.push({
      id: "near_perfect",
      href,
      meta: {
        nameEn: nearPerfect.nameEn,
        nameFa: nearPerfect.nameFa,
        goals: nearPerfect.bestGoals,
        total: nearPerfect.questionCount,
        needsEnergy,
      },
    });
  }

  if (liveChallengeCount > 0) {
    out.push({ id: "live_challenge", href: "/play/survival" });
  } else if (survivalBest > 0) {
    out.push({ id: "beat_record", href: "/play/survival" });
  }

  // Skip generic quick_penalty when we already pitched a specific bank.
  if (out.length < 3 && stamina > 0 && !nearPerfect) {
    out.push({ id: "quick_penalty", href: "/play/penalty" });
  }

  if (out.length < 2) {
    out.push({ id: "new_duel", href: "/play/duel" });
  }

  // Dedupe by id while preserving order
  const seen = new Set<PlayPlaylistId>();
  return out
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .slice(0, 3);
}
