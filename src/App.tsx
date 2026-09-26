import { useState } from "react";
import { useGame } from "./state/useGame";
import { solveChipPlan } from "./lib/chipPlan";
import { Home } from "./screens/Home";
import { Setup } from "./screens/Setup";
import { ChipPlanScreen } from "./screens/ChipPlan";
import { LiveGame } from "./screens/LiveGame";
import { CashOut } from "./screens/CashOut";
import { Settle } from "./screens/Settle";
import { History } from "./screens/History";
import type { ChipPlanCore, ChipPlanResult, GameSetup, Screen } from "./types";

type PendingSetup = {
  setup: GameSetup;
  playerNames: string[];
  chipPlan: ChipPlanResult;
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [pending, setPending] = useState<PendingSetup | null>(null);
  const {
    activeGame,
    history,
    startGame,
    addRebuy,
    undoRebuy,
    addLatePlayer,
    setCashOut,
    finishGame,
  } = useGame();

  const goHome = () => setScreen("home");

  switch (screen) {
    case "home":
      return (
        <Home
          activeGame={activeGame}
          history={history}
          onNewGame={() => setScreen("setup")}
          onResume={() => setScreen("liveGame")}
          onOpenHistory={() => setScreen("history")}
        />
      );

    case "setup":
      return (
        <Setup
          onBack={goHome}
          onSubmit={(setup, playerNames) => {
            const chipPlan = solveChipPlan({
              inventory: setup.inventory,
              buyIn: setup.buyInAmount,
              plannedBuyIns: setup.plannedBuyIns,
            });
            setPending({ setup, playerNames, chipPlan });
            setScreen("chipPlan");
          }}
        />
      );

    case "chipPlan": {
      if (!pending) {
        setScreen("setup");
        return null;
      }
      return (
        <ChipPlanScreen
          setup={pending.setup}
          chipPlan={pending.chipPlan}
          onBack={() => setScreen("setup")}
          onApply={(plan: ChipPlanCore) => {
            const finalPlan: ChipPlanResult = {
              ok: true,
              ...plan,
              alternatives: pending.chipPlan.ok ? pending.chipPlan.alternatives : [],
            };
            startGame(pending.setup, pending.playerNames, finalPlan);
            setPending(null);
            setScreen("liveGame");
          }}
        />
      );
    }

    case "liveGame":
      if (!activeGame) {
        setScreen("home");
        return null;
      }
      return (
        <LiveGame
          game={activeGame}
          onBack={goHome}
          onRebuy={(playerId) => addRebuy(playerId, activeGame.setup.buyInAmount)}
          onUndoRebuy={(playerId) => undoRebuy(playerId, activeGame.setup.buyInAmount)}
          onAddLatePlayer={(name) => addLatePlayer(name, activeGame.setup.buyInAmount)}
          onCashOut={() => setScreen("cashOut")}
        />
      );

    case "cashOut":
      if (!activeGame) {
        setScreen("home");
        return null;
      }
      return (
        <CashOut
          game={activeGame}
          onBack={() => setScreen("liveGame")}
          onSetCashOut={setCashOut}
          onSettle={() => setScreen("settle")}
        />
      );

    case "settle":
      if (!activeGame) {
        setScreen("home");
        return null;
      }
      return (
        <Settle
          game={activeGame}
          onBack={() => setScreen("cashOut")}
          onFinish={() => {
            finishGame();
            setScreen("home");
          }}
        />
      );

    case "history":
      return <History history={history} onBack={goHome} />;

    default:
      return null;
  }
}
