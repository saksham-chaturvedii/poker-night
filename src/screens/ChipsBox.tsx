import { Screen } from "../components/Screen";
import { NumberStepper } from "../components/NumberStepper";
import { ChipPill } from "../components/ChipPill";
import type { ChipDenom } from "../types";

type ChipsBoxProps = {
  inventory: ChipDenom[];
  onChange: (inventory: ChipDenom[]) => void;
  onBack: () => void;
  onSubmit: () => void;
};

export function ChipsBox({ inventory, onChange, onBack, onSubmit }: ChipsBoxProps) {
  const canSubmit = inventory.some((d) => d.count > 0);

  const updateCount = (value: number, count: number) => {
    onChange(inventory.map((d) => (d.value === value ? { ...d, count } : d)));
  };

  return (
    <Screen
      title="Chip Inventory"
      onBack={onBack}
      footer={
        <button className="btn btn-primary btn-large" disabled={!canSubmit} onClick={onSubmit}>
          Plan chips →
        </button>
      }
    >
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
              onChange={(v) => updateCount(denom.value, v)}
            />
          </div>
        ))}
      </section>
    </Screen>
  );
}
