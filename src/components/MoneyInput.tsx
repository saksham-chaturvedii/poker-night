type MoneyInputProps = {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** "hero" makes this the dominant number on the screen — used for the
   * one figure everything else derives from (Setup's buy-in). */
  size?: "default" | "hero";
};

export function MoneyInput({ value, onChange, placeholder, autoFocus, size = "default" }: MoneyInputProps) {
  return (
    <div className={size === "hero" ? "money-input money-input-hero" : "money-input"}>
      <span className="money-input-prefix">₹</span>
      <input
        // A plain text field with inputMode+pattern, not type="number" —
        // buy-ins are always whole rupees, and this combination is the
        // reliable cross-platform way to get a bare numeric keypad (no
        // decimal/e/+/- keys, no browser spinner UI, which type="number"
        // doesn't consistently avoid).
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        placeholder={placeholder}
        autoFocus={autoFocus}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, "");
          onChange(raw === "" ? undefined : Number(raw));
        }}
      />
    </div>
  );
}
