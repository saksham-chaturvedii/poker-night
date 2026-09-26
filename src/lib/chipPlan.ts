// Solves for a starting stack + chip-to-rupee rate from a physical chip
// inventory (fixed denominations — what's printed on the chips) and a
// buy-in amount. Pure, no React — see chipPlan.test.ts for the property
// tests this must satisfy.
//
// The chips' printed values never change; what a table decides — well or
// badly — is the RATE between chip value and rupees. This solver picks a
// clean rate and a starting stack that sums to the buy-in at that rate,
// preferring 1:1 (chips are rupees) and only scaling when the box can't
// otherwise cover the buy-ins.

import type { ChipDenom, ChipPlan, ChipPlanCore, ChipPlanResult, DenomRung } from "../types";

/** Candidate chip-to-rupee rates, best (most readable) first. A rate of 2
 * means "2 in chips = ₹1"; 0.5 means "1 in chips = ₹2". */
export const NICE_RATES = [1, 2, 0.5, 5, 0.2, 10, 0.1, 4, 0.25, 2.5];

const IDEAL_SHAPE_FULL = [0.35, 0.3, 0.2, 0.1, 0.05];

/** Penalty per denomination the box actually has (cap > 0) but a candidate
 * stack skips entirely. A real set is meant to use every chip you own — the
 * small ones for blinds, progressively fewer of the bigger ones — so a
 * "complete" stack should always outrank one that quietly drops a
 * denomination, even at a slightly less clean rate. */
const UNUSED_DENOM_PENALTY = 12;

/** Max feasible stacks to gather per rate before giving up — keeps the
 * search bounded even for generous inventories/buy-ins. */
const SOLUTIONS_PER_RATE = 500;

export type SolveChipPlanInput = {
  inventory: ChipDenom[];
  buyIn: number;
  plannedBuyIns: number;
};

export function solveChipPlan(input: SolveChipPlanInput): ChipPlanResult {
  const { inventory, buyIn, plannedBuyIns } = input;

  if (!Number.isFinite(buyIn) || buyIn <= 0) {
    return fail("Buy-in must be greater than ₹0.", []);
  }
  if (!Number.isInteger(plannedBuyIns) || plannedBuyIns <= 0) {
    return fail("Planned buy-ins must be at least 1.", []);
  }
  if (inventory.length === 0) {
    return fail("Add at least one chip denomination to the inventory.", []);
  }

  const candidates = findCandidates(inventory, buyIn, plannedBuyIns);

  if (candidates.length === 0) {
    return fail(
      `No chip combination makes exactly ₹${buyIn} at any clean rate with the current inventory and ${plannedBuyIns} planned buy-ins.`,
      buildSuggestions(inventory, buyIn, plannedBuyIns),
    );
  }

  candidates.sort((a, b) => a.score - b.score);
  const [best, ...rest] = candidates;
  const bestCore = toCore(best, inventory, plannedBuyIns);
  const alternatives = rest.slice(0, 2).map((c) => toCore(c, inventory, plannedBuyIns));

  const plan: ChipPlan = { ok: true, ...bestCore, alternatives };
  return plan;
}

/** Quick feasibility check (no scoring/ranking) — used to build suggestions. */
export function isFeasible(inventory: ChipDenom[], buyIn: number, plannedBuyIns: number): boolean {
  if (buyIn <= 0 || plannedBuyIns <= 0 || inventory.length === 0) return false;
  return findCandidates(inventory, buyIn, plannedBuyIns, 1).length > 0;
}

/** Re-solves the stack for a manually fixed rate (the "Adjust" affordance —
 * a player taps the rate to lock it, e.g. a house convention of "2 in chips
 * = ₹1", and we find the best-scoring stack at exactly that rate). Returns
 * null if the buy-in can't be made at that rate with the current inventory. */
export function planForRate(
  inventory: ChipDenom[],
  rate: number,
  buyIn: number,
  plannedBuyIns: number,
): ChipPlanCore | null {
  const values = inventory.map((d) => d.value);
  const caps = inventory.map((d) => Math.floor(d.count / plannedBuyIns));
  const target = toIntegerTarget(buyIn * rate);
  if (target === null || target <= 0) return null;

  const solutions = solveStack(values, caps, target, SOLUTIONS_PER_RATE);
  if (solutions.length === 0) return null;

  const rateIndex = NICE_RATES.indexOf(rate);
  const best = solutions
    .map((qty) => ({
      rate,
      qty,
      score: scoreCandidate(values, qty, caps, rate, rateIndex < 0 ? NICE_RATES.length : rateIndex),
    }))
    .sort((a, b) => a.score - b.score)[0];

  return toCore(best, inventory, plannedBuyIns);
}

// ---------------------------------------------------------------------------

type Candidate = { rate: number; qty: number[]; score: number };

function findCandidates(
  inventory: ChipDenom[],
  buyIn: number,
  plannedBuyIns: number,
  stopAfter?: number,
): Candidate[] {
  const values = inventory.map((d) => d.value);
  const caps = inventory.map((d) => Math.floor(d.count / plannedBuyIns));
  const maxPossible = caps.reduce((sum, cap, i) => sum + cap * values[i], 0);
  const found: Candidate[] = [];

  NICE_RATES.forEach((rate, rateIndex) => {
    const target = toIntegerTarget(buyIn * rate);
    if (target === null || target <= 0 || target > maxPossible) return;

    const solutions = solveStack(values, caps, target, SOLUTIONS_PER_RATE);
    for (const qty of solutions) {
      const score = scoreCandidate(values, qty, caps, rate, rateIndex);
      found.push({ rate, qty, score });
      if (stopAfter && found.length >= stopAfter) return;
    }
  });

  return found;
}

/** buyIn * rate should land on a whole number of "in chips" — reject (with
 * tolerance for float error) anything that doesn't. */
function toIntegerTarget(raw: number): number | null {
  const rounded = Math.round(raw);
  if (Math.abs(raw - rounded) > 1e-6) return null;
  return rounded;
}

/** Bounded knapsack: all quantity vectors 0<=q_i<=caps[i] with
 * sum(q_i * values[i]) === target exactly, up to `limit` results. Unlike a
 * denomination ladder, q_i === 0 is completely normal here (not every
 * denomination needs to appear in every stack). */
function solveStack(values: number[], caps: number[], target: number, limit: number): number[][] {
  const n = values.length;
  const results: number[][] = [];

  // maxSuffix[i] = max sum achievable using denominations i..n-1
  const maxSuffix = new Array(n + 1).fill(0);
  for (let i = n - 1; i >= 0; i--) maxSuffix[i] = maxSuffix[i + 1] + caps[i] * values[i];

  const q = new Array(n).fill(0);

  function dfs(i: number, remaining: number) {
    if (results.length >= limit) return;
    if (remaining < 0) return;
    if (remaining > maxSuffix[i]) return;
    if (i === n) {
      if (remaining === 0) results.push(q.slice());
      return;
    }
    const maxQ = Math.min(caps[i], Math.floor(remaining / values[i]));
    for (let k = maxQ; k >= 0; k--) {
      q[i] = k;
      dfs(i + 1, remaining - k * values[i]);
      if (results.length >= limit) return;
    }
    q[i] = 0;
  }

  dfs(0, target);
  return results;
}

function idealShape(len: number): number[] {
  const base = IDEAL_SHAPE_FULL.slice(0, len);
  const sum = base.reduce((a, b) => a + b, 0);
  return base.map((v) => v / sum);
}

function scoreCandidate(
  values: number[],
  qty: number[],
  caps: number[],
  rate: number,
  rateIndex: number,
): number {
  const totalChips = qty.reduce((a, b) => a + b, 0);
  const usedIndices = qty.map((q, i) => (q > 0 ? i : -1)).filter((i) => i >= 0);
  const smallBlind = Math.min(...usedIndices.map((i) => values[i]));
  const bigBlind = smallBlind * 2;
  const stackInChips = qty.reduce((sum, q, i) => sum + q * values[i], 0);
  const bigBlindsInStack = stackInChips / bigBlind;

  let blindPenalty = 0;
  if (bigBlindsInStack < 25) blindPenalty = 25 - bigBlindsInStack;
  else if (bigBlindsInStack > 100) blindPenalty = bigBlindsInStack - 100;

  const ideal = idealShape(usedIndices.length);
  let shapePenalty = 0;
  usedIndices.forEach((idx, rank) => {
    shapePenalty += Math.abs(qty[idx] / totalChips - ideal[rank]);
  });

  let sizePenalty = 0;
  if (totalChips < 15) sizePenalty = 15 - totalChips;
  else if (totalChips > 30) sizePenalty = totalChips - 30;

  // How cleanly the smallest chip in play converts to rupees — prefer a
  // whole or half-rupee value over something like ₹1.67.
  const smallBlindInRupees = smallBlind / rate;
  const doubled = smallBlindInRupees * 2;
  const distFromHalfRupee = Math.abs(doubled - Math.round(doubled));
  const cleanlinessPenalty = distFromHalfRupee;

  let unusedPenalty = 0;
  for (let i = 0; i < qty.length; i++) {
    if (caps[i] > 0 && qty[i] === 0) unusedPenalty += UNUSED_DENOM_PENALTY;
  }

  return (
    rateIndex * 5 +
    blindPenalty * 2 +
    shapePenalty * 10 +
    sizePenalty * 1 +
    cleanlinessPenalty * 4 +
    unusedPenalty
  );
}

function toCore(candidate: Candidate, inventory: ChipDenom[], plannedBuyIns: number): ChipPlanCore {
  const { rate, qty, score } = candidate;
  const values = inventory.map((d) => d.value);

  const rungs: DenomRung[] = values
    .map((value, i) => ({ value, qtyPerPlayer: qty[i] }))
    .filter((rung) => rung.qtyPerPlayer > 0);

  const totalChipsPerPlayer = qty.reduce((a, b) => a + b, 0);
  const stackInChips = qty.reduce((sum, q, i) => sum + q * values[i], 0);
  const smallBlind = Math.min(...rungs.map((r) => r.value));
  const bigBlind = smallBlind * 2;

  const remainingInBox: Record<number, number> = {};
  inventory.forEach((d, i) => {
    remainingInBox[d.value] = d.count - qty[i] * plannedBuyIns;
  });

  return {
    buyIn: round2(stackInChips / rate),
    rungs,
    totalChipsPerPlayer,
    stackInChips,
    chipsPerRupee: rate,
    smallBlind,
    bigBlind,
    bigBlindsInStack: stackInChips / bigBlind,
    remainingInBox,
    score,
  };
}

function buildSuggestions(inventory: ChipDenom[], buyIn: number, plannedBuyIns: number): string[] {
  const suggestions: string[] = [];

  for (let p = plannedBuyIns - 1; p >= 1; p--) {
    if (isFeasible(inventory, buyIn, p)) {
      suggestions.push(
        `Stock chips for ${p} buy-in${p === 1 ? "" : "s"} instead of ${plannedBuyIns} — that frees up more chips per stack.`,
      );
      break;
    }
  }

  if (suggestions.length === 0) {
    suggestions.push("Add more chips to your box, or reduce the number of players.");
  }

  return suggestions;
}

function fail(reason: string, suggestions: string[]): ChipPlanResult {
  return { ok: false, reason, suggestions };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
