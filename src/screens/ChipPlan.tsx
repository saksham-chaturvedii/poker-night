import { useState } from "react";
import { Screen } from "../components/Screen";
import { ChipPill } from "../components/ChipPill";
import { MoneyAmount } from "../components/MoneyAmount";
import { StatusBanner } from "../components/StatusBanner";
import { formatRate } from "../lib/format";
import { NICE_RATES, planForRate } from "../lib/chipPlan";
import type { ChipPlanCore, ChipPlanResult, GameSetup } from "../types";

type ChipPlanProps = {
  setup: GameSetup;
  chipPlan: ChipPlanResult;
  onBack: () => void;
  onApply: (plan: ChipPlanCore) => void;
};

export function ChipPlanScreen({ setup, chipPlan, onBack, onApply }: ChipPlanProps) {
  const [showRatePicker, setShowRatePicker] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [override, setOverride] = useState<ChipPlanCore | null>(null);

  if (!chipPlan.ok) {
    return (
      <Screen title="Chip Plan" onBack={onBack}>
        <StatusBanner
          tone="warning"
          action={
            <button className="btn btn-secondary" onClick={onBack}>
              Back to setup
            </button>
          }
        >
          <p className="status-banner-title">Couldn't make an exact plan</p>
          <p>{chipPlan.reason}</p>
          <ul className="suggestion-list">
            {chipPlan.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </StatusBanner>
      </Screen>
    );
  }

  const plan = override ?? chipPlan;

  const chooseRate = (rate: number) => {
    if (rate === plan.chipsPerRupee) {
      setShowRatePicker(false);
      return;
    }
    const recomputed = planForRate(setup.inventory, rate, setup.buyInAmount, setup.plannedBuyIns);
    if (recomputed) {
      setOverride(recomputed);
      setRateError(null);
      setShowRatePicker(false);
    } else {
      setRateError(`Can't make ₹${setup.buyInAmount} at that rate with this inventory.`);
    }
  };

  return (
    <Screen
      title="Chip Plan"
      onBack={onBack}
      footer={
        <button className="btn btn-primary btn-large" onClick={() => onApply(plan)}>
          Start game →
        </button>
      }
    >
      <div className="hero-block">
        <p className="text-section">Each player gets</p>
        <div className="stack-summary">
          {plan.rungs.map((rung) => (
            <div className="stack-line" key={rung.value}>
              <ChipPill value={rung.value} />
              <span className="stack-qty">{rung.qtyPerPlayer}×</span>
              <span className="stack-name">{rung.value}</span>
              <span className="stack-subtotal">{rung.qtyPerPlayer * rung.value}</span>
            </div>
          ))}
        </div>
        <div className="stack-total">
          <span className="text-small">
            {plan.totalChipsPerPlayer} chips · {plan.stackInChips} in chips
          </span>
          <MoneyAmount value={plan.buyIn} variant="hero" />
        </div>
      </div>

      <div className="card">
        <div className="detail-block">
          {plan.chipsPerRupee !== 1 && <p className="rate-line">Playing at {formatRate(plan.chipsPerRupee)}</p>}
          <button className="btn-text" onClick={() => setShowRatePicker((s) => !s)}>
            {showRatePicker ? "Cancel" : "Change rate"}
          </button>
          {showRatePicker && (
            <div className="rate-picker">
              {NICE_RATES.map((rate) => (
                <button
                  key={rate}
                  className={rate === plan.chipsPerRupee ? "alt-option alt-option-active" : "alt-option"}
                  onClick={() => chooseRate(rate)}
                >
                  {formatRate(rate)}
                </button>
              ))}
            </div>
          )}
          {rateError && <p className="text-small text-warning">{rateError}</p>}
          {override && (
            <button className="btn-text" onClick={() => setOverride(null)}>
              Reset to best plan
            </button>
          )}
        </div>

        {chipPlan.alternatives.length > 0 && (
          <div className="detail-block">
            <p className="text-section">Other options</p>
            <div className="rate-picker">
              {chipPlan.alternatives.map((alt, i) => (
                <button
                  key={i}
                  className="alt-option"
                  onClick={() => {
                    setOverride(alt);
                    setShowRatePicker(false);
                  }}
                >
                  {alt.rungs.map((r) => `${r.qtyPerPlayer}×${r.value}`).join(" · ")}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="detail-block">
          <p className="text-section">Banker's box</p>
          <p className="text-small">Chips left after handing out {setup.plannedBuyIns} stacks:</p>
          {setup.inventory.map((denom) => (
            <div className="stack-line" key={denom.value}>
              <ChipPill value={denom.value} size="sm" />
              <span className="stack-remaining">
                {plan.remainingInBox[denom.value] ?? denom.count} / {denom.count} left
              </span>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
