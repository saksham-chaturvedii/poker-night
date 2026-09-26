import { formatMoney } from "../lib/format";

type MoneyAmountProps = {
  /** Rupee value. When `signed`, the sign of this value drives +/- and color. */
  value: number;
  variant?: "hero" | "md" | "sm";
  /** Render as a signed delta (+₹450 / −₹350) with a redundant directional
   * glyph and muted success/danger color — never color alone. */
  signed?: boolean;
  className?: string;
};

/** The one shared treatment for every rupee figure in the app — plain
 * amounts (buy-ins, pots, chip totals) and signed deltas (net results,
 * settlement instructions) alike, so money always looks like money. */
export function MoneyAmount({ value, variant = "md", signed = false, className }: MoneyAmountProps) {
  const sizeClass = `money-${variant}`;

  if (!signed) {
    return <span className={[sizeClass, className].filter(Boolean).join(" ")}>{formatMoney(value)}</span>;
  }

  const isNegative = value < 0;
  const sign = isNegative ? "−" : "+";
  const glyph = isNegative ? "▼" : "▲";
  const tone = isNegative ? "money-negative" : "money-positive";

  return (
    <span className={["money-signed", sizeClass, tone, className].filter(Boolean).join(" ")}>
      <span className="money-glyph" aria-hidden="true">
        {glyph}
      </span>
      {sign}
      {formatMoney(Math.abs(value))}
    </span>
  );
}
