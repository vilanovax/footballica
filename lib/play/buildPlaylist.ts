/**
 * Play-screen Recommended playlist — soft routing, not new modes.
 * Pure helper so the server page and client cards share the same priority rules.
 */

export type PlayPlaylistId =
  | "duel_turn"
  | "live_challenge"
  | "beat_record"
  | "quick_penalty"
  | "new_duel";

export type PlayPlaylistItem = {
  id: PlayPlaylistId;
  href: string;
};

export type BuildPlayPlaylistInput = {
  stamina: number;
  inboxCount: number;
  duelHref: string;
  survivalBest: number;
  liveChallengeCount: number;
};

/**
 * Up to 3 recommended actions. Priority:
 * 1) Active duel turn  2) Live challenge / beat record  3) Quick penalty / new duel
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
  } = input;
  const out: PlayPlaylistItem[] = [];

  if (inboxCount > 0) {
    out.push({ id: "duel_turn", href: duelHref });
  }

  if (liveChallengeCount > 0) {
    out.push({ id: "live_challenge", href: "/play/survival" });
  } else if (survivalBest > 0) {
    out.push({ id: "beat_record", href: "/play/survival" });
  }

  if (out.length < 3 && stamina > 0) {
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
