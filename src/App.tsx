import { useState } from "react";
import { useGame } from "./state/useGame";
import { solveChipPlan } from "./lib/chipPlan";
import { Home } from "./screens/Home";
import { WhosPlaying } from "./screens/WhosPlaying";
import { BuyIn } from "./screens/BuyIn";
import { ChipsBox } from "./screens/ChipsBox";
import { ChipPlanScreen } from "./screens/ChipPlan";
import { LiveGame } from "./screens/LiveGame";
import { CashOut } from "./screens/CashOut";
import { Settle } from "./screens/Settle";
import { History } from "./screens/History";
import {
  DEFAULT_INVENTORY,
  type ChipDenom,
  type ChipPlanCore,
  type ChipPlanResult,
  type GameSetup,
  type Screen,
} from "./types";

type PendingSetup = {
  setup: GameSetup;
  playerNames: string[];
  chipPlan: ChipPlanResult;
};

/** Everything collected across the three setup screens (who's playing,
 * buy-in & rebuys, chip inventory) before a game actually exists. Lives in
 * App so navigating back and forth between those screens never loses what
 * was typed. */
type SetupDraft = {
  playerNames: string[];
  buyIn: number | undefined;
  plannedBuyIns: number;
  plannedCustomized: boolean;
  inventory: ChipDenom[];
};

function makeDefaultDraft(): SetupDraft {
  return {
    playerNames: ["", ""],
    buyIn: 200,
    plannedBuyIns: 4,
    plannedCustomized: false,
    inventory: DEFAULT_INVENTORY.map((d) => ({ ...d })),
  };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [draft, setDraft] = useState<SetupDraft>(makeDefaultDraft);
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
    discardActiveGame,
    deleteHistoryGame,
  } = useGame();

  const goHome = () => setScreen("home");

  switch (screen) {
    case "home":
      return (
        <Home
          activeGame={activeGame}
          history={history}
          onNewGame={() => {
            setDraft(makeDefaultDraft());
            setScreen("whosPlaying");
          }}
          onResume={() => setScreen("liveGame")}
          onOpenHistory={() => setScreen("history")}
          onDeleteActive={discardActiveGame}
        />
      );

    case "whosPlaying":
      return (
        <WhosPlaying
          playerNames={draft.playerNames}
          onChange={(playerNames) => setDraft((d) => ({ ...d, playerNames }))}
          onBack={goHome}
          onNext={() => setScreen("buyIn")}
        />
      );

    case "buyIn":
      return (
        <BuyIn
          playerNames={draft.playerNames}
          buyIn={draft.buyIn}
          onBuyInChange={(buyIn) => setDraft((d) => ({ ...d, buyIn }))}
          plannedBuyIns={draft.plannedBuyIns}
          plannedCustomized={draft.plannedCustomized}
          onPlannedChange={(plannedBuyIns, plannedCustomized) =>
            setDraft((d) => ({ ...d, plannedBuyIns, plannedCustomized }))
          }
          onBack={() => setScreen("whosPlaying")}
          onNext={() => setScreen("chipsBox")}
        />
      );

    case "chipsBox":
      return (
        <ChipsBox
          inventory={draft.inventory}
          onChange={(inventory) => setDraft((d) => ({ ...d, inventory }))}
          onBack={() => setScreen("buyIn")}
          onSubmit={() => {
            const setup = {
              buyInAmount: draft.buyIn ?? 0,
              plannedBuyIns: draft.plannedBuyIns,
              inventory: draft.inventory,
            };
            const playerNames = draft.playerNames.map((n) => n.trim()).filter(Boolean);
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
        setScreen("chipsBox");
        return null;
      }
      return (
        <ChipPlanScreen
          setup={pending.setup}
          chipPlan={pending.chipPlan}
          onBack={() => setScreen("chipsBox")}
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
      return <History history={history} onBack={goHome} onDeleteGame={deleteHistoryGame} />;

    default:
      return null;
  }
}
