import { useCallback, useEffect, useState } from "react";
import { loadState, saveState, type StoredState } from "../lib/storage";
import { solveChipPlan } from "../lib/chipPlan";
import type { ChipDenom, ChipPlanResult, Game, GameSetup, Player } from "../types";

function newId(): string {
  return crypto.randomUUID();
}

export function createGame(setup: GameSetup, playerNames: string[], chipPlan?: ChipPlanResult): Game {
  const players: Player[] = playerNames.map((name) => ({
    id: newId(),
    name,
    buyIns: 1,
    totalIn: setup.buyInAmount,
  }));

  const resolvedPlan =
    chipPlan ??
    solveChipPlan({
      inventory: setup.inventory,
      buyIn: setup.buyInAmount,
      plannedBuyIns: setup.plannedBuyIns,
    });

  return {
    id: newId(),
    createdAt: Date.now(),
    setup,
    chipPlan: resolvedPlan,
    players,
  };
}

export function useGame() {
  const [state, setState] = useState<StoredState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const startGame = useCallback((setup: GameSetup, playerNames: string[], chipPlan?: ChipPlanResult) => {
    const game = createGame(setup, playerNames, chipPlan);
    setState((s) => ({ ...s, activeGame: game }));
    return game;
  }, []);

  const recomputeChipPlan = useCallback((inventory: ChipDenom[], buyIn: number, plannedBuyIns: number) => {
    setState((s) => {
      if (!s.activeGame) return s;
      const chipPlan = solveChipPlan({ inventory, buyIn, plannedBuyIns });
      return {
        ...s,
        activeGame: {
          ...s.activeGame,
          setup: { ...s.activeGame.setup, inventory, buyInAmount: buyIn, plannedBuyIns },
          chipPlan,
        },
      };
    });
  }, []);

  const addRebuy = useCallback((playerId: string, amount: number) => {
    setState((s) => {
      if (!s.activeGame) return s;
      const players = s.activeGame.players.map((p) =>
        p.id === playerId ? { ...p, buyIns: p.buyIns + 1, totalIn: p.totalIn + amount } : p,
      );
      return { ...s, activeGame: { ...s.activeGame, players } };
    });
  }, []);

  const undoRebuy = useCallback((playerId: string, amount: number) => {
    setState((s) => {
      if (!s.activeGame) return s;
      const players = s.activeGame.players.map((p) =>
        p.id === playerId && p.buyIns > 1
          ? { ...p, buyIns: p.buyIns - 1, totalIn: Math.max(0, p.totalIn - amount) }
          : p,
      );
      return { ...s, activeGame: { ...s.activeGame, players } };
    });
  }, []);

  const addLatePlayer = useCallback((name: string, buyInAmount: number) => {
    setState((s) => {
      if (!s.activeGame) return s;
      const player: Player = { id: newId(), name, buyIns: 1, totalIn: buyInAmount };
      return { ...s, activeGame: { ...s.activeGame, players: [...s.activeGame.players, player] } };
    });
  }, []);

  const setCashOut = useCallback((playerId: string, amount: number | undefined) => {
    setState((s) => {
      if (!s.activeGame) return s;
      const players = s.activeGame.players.map((p) =>
        p.id === playerId ? { ...p, cashOut: amount } : p,
      );
      return { ...s, activeGame: { ...s.activeGame, players } };
    });
  }, []);

  const setUpiId = useCallback((playerId: string, upiId: string) => {
    setState((s) => {
      if (!s.activeGame) return s;
      const players = s.activeGame.players.map((p) => (p.id === playerId ? { ...p, upiId } : p));
      return { ...s, activeGame: { ...s.activeGame, players } };
    });
  }, []);

  const finishGame = useCallback(() => {
    setState((s) => {
      if (!s.activeGame) return s;
      const finished = { ...s.activeGame, finishedAt: Date.now() };
      return { activeGame: null, history: [finished, ...s.history] };
    });
  }, []);

  const discardActiveGame = useCallback(() => {
    setState((s) => ({ ...s, activeGame: null }));
  }, []);

  return {
    activeGame: state.activeGame,
    history: state.history,
    startGame,
    recomputeChipPlan,
    addRebuy,
    undoRebuy,
    addLatePlayer,
    setCashOut,
    setUpiId,
    finishGame,
    discardActiveGame,
  };
}
