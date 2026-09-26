import { useEffect, useState } from "react";
import { Screen } from "../components/Screen";
import { NumberStepper } from "../components/NumberStepper";
import { ChipPill } from "../components/ChipPill";
import { MoneyInput } from "../components/MoneyInput";
import { DEFAULT_INVENTORY, type ChipDenom, type GameSetup } from "../types";

type SetupProps = {
  onBack: () => void;
  onSubmit: (setup: GameSetup, playerNames: string[]) => void;
};

export function Setup({ onBack, onSubmit }: SetupProps) {
  const [playerNames, setPlayerNames] = useState<string[]>(["", ""]);
  const [buyIn, setBuyIn] = useState<number | undefined>(200);
  const [inventory, setInventory] = useState<ChipDenom[]>(() => DEFAULT_INVENTORY.map((d) => ({ ...d })));
  const [plannedBuyIns, setPlannedBuyIns] = useState(4);
  const [plannedCustomized, setPlannedCustomized] = useState(false);

  const filledPlayers = playerNames.map((n) => n.trim()).filter(Boolean);

  useEffect(() => {
    if (!plannedCustomized) {
      setPlannedBuyIns(Math.max(filledPlayers.length + 2, 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filledPlayers.length, plannedCustomized]);

  const canSubmit = filledPlayers.length >= 2 && (buyIn ?? 0) > 0 && inventory.some((d) => d.count > 0);
  const rebuyCount = Math.max(plannedBuyIns - filledPlayers.length, 0);

  const updatePlayerName = (i: number, value: string) => {
    setPlayerNames((names) => names.map((n, idx) => (idx === i ? value : n)));
  };

  const addPlayerField = () => setPlayerNames((names) => [...names, ""]);
  const removePlayerField = (i: number) =>
    setPlayerNames((names) => (names.length > 2 ? names.filter((_, idx) => idx !== i) : names));

  const updateDenomCount = (value: number, count: number) => {
    setInventory((inv) => inv.map((d) => (d.value === value ? { ...d, count } : d)));
  };

  return (
    <Screen
      title="New Game"
      onBack={onBack}
      footer={
        <button
          className="btn btn-primary btn-large"
          disabled={!canSubmit}
          onClick={() => onSubmit({ buyInAmount: buyIn ?? 0, plannedBuyIns, inventory }, filledPlayers)}
        >
          Plan chips →
        </button>
      }
    >
      <section className="section">
        <h2 className="text-section">Who's playing</h2>
        {playerNames.map((name, i) => (
          <div className="row-input" key={i}>
            <input
              className="text-input"
              placeholder={`Player ${i + 1}`}
              value={name}
              onChange={(e) => updatePlayerName(i, e.target.value)}
            />
            {playerNames.length > 2 && (
              <button className="icon-btn" aria-label="Remove player" onClick={() => removePlayerField(i)}>
                ✕
              </button>
            )}
          </div>
        ))}
        <button className="btn-text" onClick={addPlayerField}>
          + Add player
        </button>
      </section>

      <section className="section">
        <h2 className="text-section">Buy-in per player</h2>
        <MoneyInput value={buyIn} onChange={setBuyIn} placeholder="e.g. 200" autoFocus size="hero" />
      </section>

      <section className="section">
        <h2 className="text-section">Stock chips for</h2>
        <div className="stepper-with-label">
          <NumberStepper
            value={plannedBuyIns}
            min={filledPlayers.length || 1}
            max={99}
            onChange={(v) => {
              setPlannedCustomized(true);
              setPlannedBuyIns(v);
            }}
          />
          <span>buy-ins</span>
        </div>
        <p className="text-small">
          Everyone starts with one stack. If someone loses it all and buys in again, that stack comes out
          of the box too.
        </p>
        <p className="text-small text-subtle">
          = {filledPlayers.length || 0} starting stack{filledPlayers.length === 1 ? "" : "s"} + {rebuyCount}{" "}
          rebuy{rebuyCount === 1 ? "" : "s"}
        </p>
      </section>

      <section className="section">
        <h2 className="text-section">Chips in the box</h2>
        <p className="text-small">Set 0 for any denomination your set doesn't include.</p>
        {inventory.map((denom) => (
          <div className="row-input chip-row" key={denom.value}>
            <ChipPill value={denom.value} />
            <NumberStepper
              value={denom.count}
              min={0}
              max={999}
              onChange={(v) => updateDenomCount(denom.value, v)}
            />
          </div>
        ))}
      </section>
    </Screen>
  );
}
