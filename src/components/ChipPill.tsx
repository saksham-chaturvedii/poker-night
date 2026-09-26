type ChipPillProps = {
  value: number;
  size?: "sm" | "md";
};

/** Base colour + accent (edge spots, suits, number) per denomination —
 * matched to a standard 200-pc clay-composite set (5/10/25/50/100). */
const CHIP_COLORS: Record<number, { base: string; accent: string }> = {
  5: { base: "#9c2b32", accent: "#f3ead9" }, // red
  10: { base: "#1f5c3f", accent: "#f3ead9" }, // green
  25: { base: "#2f4a63", accent: "#f3ead9" }, // navy/steel blue
  50: { base: "#1c1c1c", accent: "#f3ead9" }, // black
  100: { base: "#f3ead9", accent: "#2f4a63" }, // cream (printed "1" on a real set)
};
const FALLBACK_COLORS = { base: "#5b5b5b", accent: "#f3ead9" };

/** What's actually printed on the chip — a real 200-pc set prints "1" on
 * the chip that plays as 100, same as a "5" reads as its face value. */
const CHIP_LABELS: Record<number, string> = {
  100: "1",
};

const EDGE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const SUIT_ANGLES = [45, 135, 225, 315];
const SUITS = ["♠", "♥", "♦", "♣"];

function polar(radius: number, angleDeg: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [50 + radius * Math.cos(rad), 50 + radius * Math.sin(rad)];
}

/** A poker chip, rendered as SVG so it stays crisp at any size — a coloured
 * base with edge spots, suit marks, and the denomination printed in the
 * centre, matching the look of a real clay-composite chip. */
export function ChipPill({ value, size = "md" }: ChipPillProps) {
  const { base, accent } = CHIP_COLORS[value] ?? FALLBACK_COLORS;
  const label = CHIP_LABELS[value] ?? String(value);
  const fontSize = label.length >= 3 ? 26 : 30;

  return (
    <span className={`chip-pill chip-pill-${size}`}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-label={`${value} chip`}>
        <circle cx="50" cy="50" r="48" fill={base} stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        {EDGE_ANGLES.map((angle) => (
          <rect
            key={angle}
            x="47"
            y="2.5"
            width="6"
            height="13"
            rx="1.5"
            fill={accent}
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
        <circle cx="50" cy="50" r="34" fill="none" stroke={accent} strokeWidth="2.5" />
        {SUIT_ANGLES.map((angle, i) => {
          const [x, y] = polar(34, angle);
          return (
            <text
              key={angle}
              x={x}
              y={y}
              fill={accent}
              fontSize="9"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {SUITS[i]}
            </text>
          );
        })}
        <circle cx="50" cy="50" r="24" fill={base} />
        <text
          x="50"
          y="52"
          fill={accent}
          fontSize={fontSize}
          fontWeight="700"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {label}
        </text>
      </svg>
    </span>
  );
}
