type NumberFieldProps = {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** "hero" makes this the dominant number on the screen — same meaning
   * as MoneyInput's "hero", used for the one figure a block is built
   * around (Cash Out's chip count). */
  size?: "default" | "hero";
  /** Short trailing unit, shown muted after the number — e.g. "chips",
   * "buy-ins". The generic counterpart to MoneyInput's leading "₹". */
  suffix?: string;
  /** Accessible name, for fields with no adjacent visible label. */
  label?: string;
};

/** The one number-entry pattern for the whole app, outside of money
 * itself — a plain bordered text field with a big tabular-nums number,
 * no stepper, no wheel, no native spinner. Same shape and same input
 * plumbing as MoneyInput (type="text" + inputMode="numeric" + pattern,
 * not type="number", for a reliable bare numeric keypad across mobile
 * browsers), just without the currency prefix. Enter blurs (and so
 * commits/dismisses the keyboard) the same way a form field should. */
export function NumberField({
  value,
  onChange,
  onBlur,
  placeholder,
  autoFocus,
  size = "default",
  suffix,
  label,
}: NumberFieldProps) {
  return (
    <div className={size === "hero" ? "number-input number-input-hero" : "number-input"}>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label={label}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, "");
          onChange(raw === "" ? undefined : Number(raw));
        }}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      {suffix && <span className="number-input-suffix">{suffix}</span>}
    </div>
  );
}
