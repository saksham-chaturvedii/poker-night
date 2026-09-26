// Turns each player's net position (cash-out minus total buy-ins) into the
// smallest possible set of payments — the same "simplify debts" greedy
// max-debtor/max-creditor matching Splitwise uses. Pure, no React.

import type { Payment, SettleResult } from "../types";

const MISMATCH_TOLERANCE = 0.01;

export type NetInput = { playerId: string; totalIn: number; cashOut: number };

export function computeNets(inputs: NetInput[]): Record<string, number> {
  const nets: Record<string, number> = {};
  for (const p of inputs) nets[p.playerId] = round2(p.cashOut - p.totalIn);
  return nets;
}

export function simplifyDebts(nets: Record<string, number>): SettleResult {
  const total = Object.values(nets).reduce((a, b) => a + b, 0);
  if (Math.abs(total) > MISMATCH_TOLERANCE) {
    return { ok: false, reason: "Cash-out totals don't match total buy-ins.", totalMismatch: round2(total) };
  }

  // Work in whole rupees for the matching so we never generate paise-level
  // payments; push any rounding residue onto the largest transaction.
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];
  for (const [id, net] of Object.entries(nets)) {
    const cents = Math.round(net * 100);
    if (cents > 0) creditors.push({ id, amount: cents });
    else if (cents < 0) debtors.push({ id, amount: -cents });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const payments: Payment[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.amount, debtor.amount);

    if (amount > 0) {
      payments.push({ fromPlayerId: debtor.id, toPlayerId: creditor.id, amount: amount / 100, paid: false });
    }

    creditor.amount -= amount;
    debtor.amount -= amount;
    if (creditor.amount === 0) ci++;
    if (debtor.amount === 0) di++;
  }

  // Round each payment to whole rupees; dump any leftover paise onto the
  // largest payment so the settlement still closes exactly.
  const rounded = payments.map((p) => ({ ...p, amount: Math.round(p.amount) }));
  const residue = round2(
    payments.reduce((a, p) => a + p.amount, 0) - rounded.reduce((a, p) => a + p.amount, 0),
  );
  if (rounded.length > 0 && Math.abs(residue) >= 1) {
    const largest = rounded.reduce((best, p, i) => (p.amount > rounded[best].amount ? i : best), 0);
    rounded[largest].amount += Math.round(residue);
  }

  return { ok: true, nets, payments: rounded.filter((p) => p.amount > 0) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
