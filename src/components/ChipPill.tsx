type ChipPillProps = {
  value: number;
  size?: "sm" | "md";
};

/** A neutral chip marker showing the printed denomination. No colour —
 * colour varies by physical set and carries no meaning of its own. */
export function ChipPill({ value, size = "md" }: ChipPillProps) {
  return <span className={`chip-pill chip-pill-${size}`}>{value}</span>;
}
