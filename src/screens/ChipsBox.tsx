import { useState } from "react";
import { Screen } from "../components/Screen";
import { ChipPill } from "../components/ChipPill";
import { NumberWheel } from "../components/NumberWheel";
import { NumberPickerSheet } from "../components/NumberPickerSheet";
import type { ChipDenom } from "../types";

type ChipsBoxProps = {
  inventory: ChipDenom[];
  onChange: (inventory: ChipDenom[]) => void;
  onBack: () => void;
  onSubmit: () => void;
};

export function ChipsBox({ inventory, onChange, onBack, onSubmit }: ChipsBoxProps) {
  const [openDenom, setOpenDenom] = useState<number | null>(null);
  const canSubmit = inventory.some((d) => d.count > 0);

  const updateCount = (value: number, count: number) => {
    onChange(inventory.map((d) => (d.value === value ? { ...d, count } : d)));
  };

  const openDenomEntry = inventory.find((d) => d.value === openDenom);

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
          <button
            type="button"
            className="chip-count-row"
            key={denom.value}
            onClick={() => setOpenDenom(denom.value)}
          >
            <ChipPill value={denom.value} />
            <span className="chip-count-row-count">{denom.count}</span>
            <span className="chip-count-row-chevron" aria-hidden="true">
              ›
            </span>
          </button>
        ))}
      </section>

      {openDenomEntry && (
        <NumberPickerSheet title={`${openDenomEntry.value} chip — how many in the box`} onClose={() => setOpenDenom(null)}>
          <NumberWheel
            value={openDenomEntry.count}
            min={0}
            max={200}
            step={1}
            itemHeight={52}
            label={`${openDenomEntry.value} chip count in the box`}
            onChange={(v) => updateCount(openDenomEntry.value, v)}
          />
        </NumberPickerSheet>
      )}
    </Screen>
  );
}
