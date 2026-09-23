/**
 * Play-screen Recommended playlist — soft routing, not new modes.
 * Pure helper so the server page and client cards share the same priority rules.
 */

export type PlayPlaylistId =
  | "live_challenge"
  | "beat_record"
  | "play_penalty"
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
 * 1) Live challenge / Survival beat-record
 * 2) Penalty (when stamina allows)
 * 3) New duel (when no inbox — your-turn is owned by DuelInboxBanner)
 * GotD formats live inside Duel only — never listed here.
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

  if (liveChallengeCount > 0) {
    out.push({ id: "live_challenge", href: "/play/survival" });
  } else if (survivalBest > 0) {
    out.push({ id: "beat_record", href: "/play/survival" });
  }

  if (out.length < 3 && stamina > 0) {
    out.push({ id: "play_penalty", href: "/play/penalty" });
  }

  // New duel only when nothing is waiting — banner owns your-turn CTA.
  if (out.length < 3 && inboxCount <= 0) {
    out.push({ id: "new_duel", href: duelHref });
  }

  const seen = new Set<PlayPlaylistId>();
  return out
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .slice(0, 3);
}
