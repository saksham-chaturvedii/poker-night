type NumberStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
};

export function NumberStepper({ value, onChange, min = 0, max = Infinity, step = 1, label }: NumberStepperProps) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" className="stepper-btn" onClick={dec} aria-label="Decrease">
        −
      </button>
      <input
        className="stepper-input"
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
      />
      <button type="button" className="stepper-btn" onClick={inc} aria-label="Increase">
        +
      </button>
    </div>
  );
}
