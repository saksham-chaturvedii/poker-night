import { describe, expect, it } from "vitest";
import { computeNets, simplifyDebts } from "./settle";

describe("simplifyDebts", () => {
  it("produces the classic 3-player example with the minimum transactions", () => {
    // A is down 100, B is down 50, C is up 150.
    const nets = { a: -100, b: -50, c: 150 };
    const result = simplifyDebts(nets);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.payments.length).toBeLessThanOrEqual(2); // n-1 = 2
    const total = result.payments.reduce((sum, p) => sum + p.amount, 0);
    expect(total).toBe(150);
    for (const p of result.payments) {
      expect(p.toPlayerId).toBe("c");
    }
  });

  it("never produces more than n-1 payments for n players", () => {
    const nets: Record<string, number> = { a: -300, b: -20, c: 40, d: 100, e: 180 };
    const result = simplifyDebts(nets);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payments.length).toBeLessThanOrEqual(Object.keys(nets).length - 1);

    // sanity: net effect of payments matches the original nets
    const received: Record<string, number> = {};
    for (const id of Object.keys(nets)) received[id] = 0;
    for (const p of result.payments) {
      received[p.fromPlayerId] -= p.amount;
      received[p.toPlayerId] += p.amount;
    }
    for (const id of Object.keys(nets)) {
      expect(received[id]).toBeCloseTo(nets[id], 0);
    }
  });

  it("returns ok:false with the mismatch amount when nets don't sum to zero", () => {
    const result = simplifyDebts({ a: -100, b: 50 }); // off by 50
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.totalMismatch).toBeCloseTo(-50, 2);
  });

  it("handles everyone breaking even (all-zero nets) with no payments", () => {
    const result = simplifyDebts({ a: 0, b: 0, c: 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payments).toHaveLength(0);
  });

  it("tolerates tiny floating point drift", () => {
    const result = simplifyDebts({ a: -100.004, b: 100.001 });
    expect(result.ok).toBe(true);
  });
});

describe("computeNets", () => {
  it("nets cash-out minus total buy-ins per player", () => {
    const nets = computeNets([
      { playerId: "a", totalIn: 200, cashOut: 350 },
      { playerId: "b", totalIn: 400, cashOut: 250 },
    ]);
    expect(nets.a).toBe(150);
    expect(nets.b).toBe(-150);
  });
});
