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
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        autoFocus={autoFocus}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? undefined : Number(raw));
        }}
      />
    </div>
  );
}
