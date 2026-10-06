import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { loadGridPlayers } from "@/lib/grid/puzzle";
import { prisma } from "@/lib/prisma";
import { buildTikiTakaAxes } from "@/lib/duel/tikiTakaAxes";
import {
  emptyTikiCells,
  type TikiTakaBoardJson,
} from "@/lib/duel/tikiTakaTypes";

export type TikiTakaRoundShell = {
  roundNumber: number;
  roundType: "TIKI_TAKA";
  attackerId: string;
  draftOptionIds: Prisma.InputJsonValue;
  boardJson: Prisma.InputJsonValue;
  board: TikiTakaBoardJson;
};

export async function tikiTakaRoundCreateData(opts: {
  duelId: string;
  attackerId: string;
  roundNumber: number;
}): Promise<TikiTakaRoundShell> {
  const players = await loadGridPlayers(prisma);
  const axes = buildTikiTakaAxes(players);

  void opts.duelId;

  const board: TikiTakaBoardJson = {
    kind: "TIKI_TAKA",
    axes: { rows: axes.rows, cols: axes.cols },
    cells: emptyTikiCells(),
    usedPlayerIds: [],
    turnOwnerId: opts.attackerId,
    turnStartedAt: null,
    status: "IN_PROGRESS",
    winnerId: null,
    winLine: null,
  };

  return {
    roundNumber: opts.roundNumber,
    roundType: "TIKI_TAKA",
    attackerId: opts.attackerId,
    draftOptionIds: [],
    boardJson: board as unknown as Prisma.InputJsonValue,
    board,
  };
}
