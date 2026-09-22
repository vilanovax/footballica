"use server";

import { prisma } from "@/lib/prisma";
import { getGameConfig } from "@/lib/game/gameConfig";
import { duelEnabledModes } from "@/lib/game/liveModes";
import { requireUserClub } from "@/lib/player/current";
import { canUserAct, describeTurn } from "@/lib/duel/fsm";
import { offeredSpecialForTurn } from "@/lib/duel/offeredSpecial";
import { lockDuelSpecialRound } from "@/lib/duel/lockSpecialRound";
import { duelSnapshotInclude } from "@/lib/duel/include";
import { parseMemoryBoard } from "@/lib/duel/memoryTypes";
import type { DuelSnapshot } from "@/lib/duel/snapshot";
import type { LiveModeId } from "@/lib/game/economy";
import { DUEL_TYPE_TO_LIVE_MODE, isSpecialDuelRoundType } from "@/lib/game/liveModes";

export type SelectSpecialResult =
  | {
      ok: true;
      duel: DuelSnapshot;
      mode: LiveModeId;
      roundNumber: number;
      /** Memory board when mode is memory (attack UI needs it immediately). */
      board: ReturnType<typeof parseMemoryBoard>;
    }
  | {
      ok: false;
      error:
        | "not_authenticated"
        | "not_found"
        | "not_your_turn"
        | "special_already_used"
        | "mode_disabled"
        | "not_offered"
        | "already_locked"
        | "server_error";
    };

/**
 * Lock this turn's server-offered special (once per duel).
 * Client never chooses which LiveMode — only Special vs Quiz.
 */
export async function selectDuelSpecial(
  duelId: string,
): Promise<SelectSpecialResult> {
  const pair = await requireUserClub();
  if (!pair) return { ok: false, error: "not_authenticated" };
  const { user } = pair;

  const config = await getGameConfig();
  const enabled = duelEnabledModes(config);

  const duel = await prisma.duelMatch.findUnique({
    where: { id: duelId },
    include: duelSnapshotInclude,
  });
  if (!duel) return { ok: false, error: "not_found" };
  if (duel.timeoutUserId === user.id) {
    return { ok: false, error: "not_your_turn" };
  }
  if (
    !canUserAct({
      status: duel.status,
      userId: user.id,
      challengerId: duel.challengerId,
      opponentId: duel.opponentId,
    })
  ) {
    return { ok: false, error: "not_your_turn" };
  }

  const turn = describeTurn(duel.status);
  if (turn.kind !== "attack" || turn.roundNumber == null) {
    return { ok: false, error: "not_your_turn" };
  }

  const round = duel.rounds.find((r) => r.roundNumber === turn.roundNumber);
  if (!round) return { ok: false, error: "not_found" };

  // Idempotent: already locked as a special → return that mode
  if (isSpecialDuelRoundType(round.roundType)) {
    const mode = DUEL_TYPE_TO_LIVE_MODE[round.roundType];
    const res = await lockDuelSpecialRound(duelId, mode);
    if (!res.ok) return res;
    return {
      ok: true,
      duel: res.duel,
      mode,
      roundNumber: res.roundNumber,
      board:
        mode === "memory" ? parseMemoryBoard(res.boardJson) : null,
    };
  }

  const offered = offeredSpecialForTurn(duelId, turn.roundNumber, enabled);
  if (!offered) return { ok: false, error: "not_offered" };

  const res = await lockDuelSpecialRound(duelId, offered);
  if (!res.ok) return res;

  return {
    ok: true,
    duel: res.duel,
    mode: offered,
    roundNumber: res.roundNumber,
    board:
      offered === "memory" ? parseMemoryBoard(res.boardJson) : null,
  };
}
