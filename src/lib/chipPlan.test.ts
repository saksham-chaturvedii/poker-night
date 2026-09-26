import { describe, expect, it } from "vitest";
import { NICE_RATES, isFeasible, planForRate, solveChipPlan } from "./chipPlan";
import { DEFAULT_INVENTORY } from "../types";
import type { ChipDenom } from "../types";

function freshInventory(): ChipDenom[] {
  // Deep copy so tests never share mutable state.
  return DEFAULT_INVENTORY.map((d) => ({ ...d }));
}

describe("solveChipPlan", () => {
  it("solves 5 players, ₹200 buy-in, 40x5 inventory, 7 planned buy-ins", () => {
    const result = solveChipPlan({ inventory: freshInventory(), buyIn: 200, plannedBuyIns: 7 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(NICE_RATES).toContain(result.chipsPerRupee);
    const stackSum = result.rungs.reduce((a, r) => a + r.value * r.qtyPerPlayer, 0);
    expect(stackSum).toBe(result.stackInChips);
    // The stack's value in chips must equal the buy-in at the chosen rate.
    expect(stackSum).toBeCloseTo(result.buyIn * result.chipsPerRupee, 6);
    expect(result.rungs.length).toBeGreaterThan(0);
    expect(result.smallBlind).toBe(Math.min(...result.rungs.map((r) => r.value)));
    expect(result.bigBlind).toBe(result.smallBlind * 2);

    // Every rung must respect the per-denomination cap (chips must last 7 buy-ins).
    for (const rung of result.rungs) {
      const denom = freshInventory().find((d) => d.value === rung.value)!;
      expect(rung.qtyPerPlayer).toBeLessThanOrEqual(Math.floor(denom.count / 7));
      expect(rung.qtyPerPlayer).toBeGreaterThan(0);
    }
  });

  it("prefers a 1:1 rate when it already gives a healthy stack depth", () => {
    // 40 of each of 5,10,25,50,100, planned for only 2 buy-ins (generous caps).
    // At 1:1, ₹500 = 50 big blinds (smallest chip 5, BB 10) — comfortably
    // inside the ideal 25-100 BB range, so there's no reason to scale.
    const result = solveChipPlan({ inventory: freshInventory(), buyIn: 500, plannedBuyIns: 2 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.chipsPerRupee).toBe(1);
  });

  it("scales the rate for a small buy-in so the stack isn't unplayably shallow", () => {
    // ₹200 at 1:1 with smallest chip 5 is only 20 big blinds (just under the
    // 25 BB floor) — the solver should prefer doubling to a 2:1 rate (the
    // documented example: 400 in chips = ₹200) over a shallow 1:1 stack.
    const result = solveChipPlan({ inventory: freshInventory(), buyIn: 200, plannedBuyIns: 2 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.chipsPerRupee).toBeGreaterThan(1);
    expect(result.bigBlindsInStack).toBeGreaterThanOrEqual(25);
  });

  it("scales the rate to solve the shortage case a 1:1 model can't (9 players, ₹500 buy-in)", () => {
    // With 40 of each denomination and plannedBuyIns=11 (9 players + 2), caps
    // are tight: floor(40/11) = 3 per denomination. Max at 1:1 is
    // 3*(5+10+25+50+100) = 570, so ₹500 is technically makeable at 1:1 — pick
    // a genuinely tighter case instead: buy-in far beyond 1:1 capacity.
    const inventory = freshInventory();
    const plannedBuyIns = 11;
    const result = solveChipPlan({ inventory, buyIn: 1000, plannedBuyIns });
    // Max at 1:1 = 3 * 190 = 570 < 1000, so 1:1 cannot work — a scaled rate must.
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.chipsPerRupee).not.toBe(1);
    const stackSum = result.rungs.reduce((a, r) => a + r.value * r.qtyPerPlayer, 0);
    expect(stackSum).toBeCloseTo(1000 * result.chipsPerRupee, 6);
  });

  it("never exceeds the per-denomination cap derived from plannedBuyIns", () => {
    const inventory = freshInventory();
    const plannedBuyIns = 6;
    const result = solveChipPlan({ inventory, buyIn: 500, plannedBuyIns });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    for (const rung of result.rungs) {
      const denom = inventory.find((d) => d.value === rung.value)!;
      const cap = Math.floor(denom.count / plannedBuyIns);
      expect(rung.qtyPerPlayer).toBeLessThanOrEqual(cap);
    }
    for (const remaining of Object.values(result.remainingInBox)) {
      expect(remaining).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns up to two ranked alternatives alongside the best plan", () => {
    const result = solveChipPlan({ inventory: freshInventory(), buyIn: 200, plannedBuyIns: 7 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.alternatives.length).toBeLessThanOrEqual(2);
    for (const alt of result.alternatives) {
      expect(alt.score).toBeGreaterThanOrEqual(result.score);
      const sum = alt.rungs.reduce((a, r) => a + r.value * r.qtyPerPlayer, 0);
      expect(sum).toBeCloseTo(alt.buyIn * alt.chipsPerRupee, 6);
    }
  });

  it("handles a grid of players and buy-ins, always at a valid rate when feasible", () => {
    const buyIns = [100, 200, 500, 1000, 2000];
    const playerCounts = [2, 3, 4, 5, 6, 7, 8, 9];

    for (const players of playerCounts) {
      for (const buyIn of buyIns) {
        const plannedBuyIns = players + 2;
        const result = solveChipPlan({ inventory: freshInventory(), buyIn, plannedBuyIns });

        if (result.ok) {
          expect(NICE_RATES).toContain(result.chipsPerRupee);
          const sum = result.rungs.reduce((a, r) => a + r.value * r.qtyPerPlayer, 0);
          expect(sum).toBeCloseTo(buyIn * result.chipsPerRupee, 6);
          for (const rung of result.rungs) {
            expect(rung.qtyPerPlayer).toBeGreaterThan(0);
          }
        } else {
          expect(result.reason.length).toBeGreaterThan(0);
          expect(result.suggestions.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("rejects invalid inputs without throwing", () => {
    expect(solveChipPlan({ inventory: freshInventory(), buyIn: 0, plannedBuyIns: 5 }).ok).toBe(false);
    expect(solveChipPlan({ inventory: freshInventory(), buyIn: -50, plannedBuyIns: 5 }).ok).toBe(false);
    expect(solveChipPlan({ inventory: freshInventory(), buyIn: 200, plannedBuyIns: 0 }).ok).toBe(false);
    expect(solveChipPlan({ inventory: [], buyIn: 200, plannedBuyIns: 5 }).ok).toBe(false);
  });

  it("treats a denomination with count 0 as absent from the box", () => {
    const inventory = freshInventory().map((d) => (d.value === 100 ? { ...d, count: 0 } : d));
    const result = solveChipPlan({ inventory, buyIn: 200, plannedBuyIns: 7 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rungs.some((r) => r.value === 100)).toBe(false);
  });
});

describe("planForRate", () => {
  it("re-solves the stack at a manually fixed rate", () => {
    const inventory = freshInventory();
    const plan = planForRate(inventory, 2, 200, 7);
    expect(plan).not.toBeNull();
    if (!plan) return;
    expect(plan.chipsPerRupee).toBe(2);
    const sum = plan.rungs.reduce((a, r) => a + r.value * r.qtyPerPlayer, 0);
    expect(sum).toBe(200 * 2);
  });

  it("returns null when the fixed rate can't make the buy-in exactly", () => {
    const inventory = freshInventory();
    // ₹201 at 1:1 isn't makeable with denominations 5/10/25/50/100 (no
    // combination sums to an odd number).
    const plan = planForRate(inventory, 1, 201, 7);
    expect(plan).toBeNull();
  });
});

describe("isFeasible", () => {
  it("agrees with solveChipPlan's ok flag", () => {
    const cases: { buyIn: number; plannedBuyIns: number }[] = [
      { buyIn: 200, plannedBuyIns: 7 },
      { buyIn: 1000, plannedBuyIns: 11 },
      { buyIn: 500, plannedBuyIns: 6 },
    ];
    for (const c of cases) {
      const result = solveChipPlan({ inventory: freshInventory(), ...c });
      expect(isFeasible(freshInventory(), c.buyIn, c.plannedBuyIns)).toBe(result.ok);
    }
  });
});
