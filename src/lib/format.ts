import type { Game, Payment, Player } from "../types";

export function formatMoney(amount: number): string {
  const rounded = Math.round(amount);
  return `₹${rounded.toLocaleString("en-IN")}`;
}

/** Like formatMoney, but keeps up to 2 decimal places when the amount isn't
 * a whole rupee (e.g. a ₹2.50 blind after a scaled chip-to-rupee rate). */
export function formatRupees(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  if (Number.isInteger(rounded)) return `₹${rounded.toLocaleString("en-IN")}`;
  return `₹${rounded.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Human labels for the solver's candidate chip-to-rupee rates. */
const RATE_LABELS: Record<number, string> = {
  1: "1 in chips = ₹1",
  2: "2 in chips = ₹1",
  0.5: "1 in chips = ₹2",
  5: "5 in chips = ₹1",
  0.2: "1 in chips = ₹5",
  10: "10 in chips = ₹1",
  0.1: "1 in chips = ₹10",
  4: "4 in chips = ₹1",
  0.25: "1 in chips = ₹4",
  2.5: "5 in chips = ₹2",
};

export function formatRate(rate: number): string {
  return RATE_LABELS[rate] ?? `${rate} in chips = ₹1`;
}

export function playerName(players: Player[], id: string): string {
  return players.find((p) => p.id === id)?.name ?? "Unknown";
}

/** Plain-text settlement summary, ready to paste into WhatsApp. */
export function buildShareText(game: Game, payments: Payment[]): string {
  const lines: string[] = [];
  lines.push(`🃏 Poker night settlement — ${new Date(game.createdAt).toLocaleDateString("en-IN")}`);
  lines.push("");

  for (const p of game.players) {
    const net = (p.cashOut ?? 0) - p.totalIn;
    const sign = net >= 0 ? "+" : "-";
    lines.push(`${p.name}: ${sign}${formatMoney(Math.abs(net))}`);
  }

  lines.push("");
  if (payments.length === 0) {
    lines.push("Everyone's square — no payments needed. 🎉");
  } else {
    lines.push("Settle up:");
    for (const payment of payments) {
      const from = playerName(game.players, payment.fromPlayerId);
      const to = playerName(game.players, payment.toPlayerId);
      lines.push(`• ${from} → ${to}: ${formatMoney(payment.amount)}`);
    }
  }

  return lines.join("\n");
}

export function upiLink(upiId: string, amount: number, note: string): string {
  const params = new URLSearchParams({
    pa: upiId,
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}
