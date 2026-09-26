import { useEffect, useState } from "react";
import { Screen } from "../components/Screen";
import { NumberField } from "../components/NumberField";
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
  const minStock = filledCount || 1;

  // Auto-track "stock chips for" to players + 2 until the host manually
  // adjusts it — same behaviour as before, just living on its own screen now.
  useEffect(() => {
    if (!plannedCustomized) {
      onPlannedChange(Math.max(filledCount + 2, 1), false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filledCount, plannedCustomized]);

  // A local draft, decoupled from the committed value, so clearing the
  // field to type a fresh number doesn't get immediately clamped back to
  // the minimum mid-keystroke — the clamp only applies once, on blur.
  const [stockDraft, setStockDraft] = useState<number | undefined>(plannedBuyIns);
  useEffect(() => {
    setStockDraft(plannedBuyIns);
  }, [plannedBuyIns]);

  const commitStock = () => {
    const clamped = Math.min(30, Math.max(minStock, stockDraft ?? plannedBuyIns));
    setStockDraft(clamped);
    onPlannedChange(clamped, true);
  };

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
        <NumberField
          value={stockDraft}
          onChange={setStockDraft}
          onBlur={commitStock}
          suffix="buy-ins"
          label="buy-ins to stock chips for"
        />
      </section>
    </Screen>
  );
}
