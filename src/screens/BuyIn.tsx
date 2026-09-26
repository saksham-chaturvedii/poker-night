import { useEffect } from "react";
import { Screen } from "../components/Screen";
import { NumberStepper } from "../components/NumberStepper";
import { MoneyInput } from "../components/MoneyInput";

type BuyInProps = {
  playerNames: string[];
  buyIn: number | undefined;
  onBuyInChange: (value: number | undefined) => void;
  plannedBuyIns: number;
  plannedCustomized: boolean;
  onPlannedChange: (value: number, customized: boolean) => void;
  onBack: () => void;
  onNext: () => void;
};

export function BuyIn({
  playerNames,
  buyIn,
  onBuyInChange,
  plannedBuyIns,
  plannedCustomized,
  onPlannedChange,
  onBack,
  onNext,
}: BuyInProps) {
  const filledCount = playerNames.map((n) => n.trim()).filter(Boolean).length;
  const rebuyCount = Math.max(plannedBuyIns - filledCount, 0);

  // Auto-track "stock chips for" to players + 2 until the host manually
  // adjusts it — same behaviour as before, just living on its own screen now.
  useEffect(() => {
    if (!plannedCustomized) {
      onPlannedChange(Math.max(filledCount + 2, 1), false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filledCount, plannedCustomized]);

  const canProceed = (buyIn ?? 0) > 0;

  return (
    <Screen
      title="Buy-in"
      onBack={onBack}
      footer={
        <button className="btn btn-primary btn-large" disabled={!canProceed} onClick={onNext}>
          Next →
        </button>
      }
    >
      <section className="section">
        <h2 className="text-section">Buy-in per player</h2>
        <MoneyInput value={buyIn} onChange={onBuyInChange} placeholder="e.g. 200" autoFocus size="hero" />
      </section>

      <section className="section">
        <h2 className="text-section">Stock chips for</h2>
        <div className="stepper-with-label">
          <NumberStepper
            value={plannedBuyIns}
            min={filledCount || 1}
            max={99}
            onChange={(v) => onPlannedChange(v, true)}
          />
          <span>buy-ins</span>
        </div>
        <p className="text-small">
          Everyone starts with one stack. If someone loses it all and buys in again, that stack comes out
          of the box too.
        </p>
        <p className="text-small text-subtle">
          = {filledCount || 0} starting stack{filledCount === 1 ? "" : "s"} + {rebuyCount} rebuy
          {rebuyCount === 1 ? "" : "s"}
        </p>
      </section>
    </Screen>
  );
}
