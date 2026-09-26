// Core domain types for Poker Night.

/** A physical chip denomination — the number printed on it, and how many
 * of that denomination are in the box. Colour varies by set and carries no
 * meaning of its own, so it isn't part of the model. */
export type ChipDenom = {
  value: number;
  count: number;
};

export type Player = {
  id: string;
  name: string;
  /** UPI id, e.g. "name@bank" — optional, used for payment deep-links */
  upiId?: string;
  /** Number of buy-ins taken so far (initial buy-in counts as 1) */
  buyIns: number;
  /** Total ₹ put into the pot (buyIns * buyInAmount, kept explicit for late joiners at different amounts) */
  totalIn: number;
  /** Final cash-out amount in ₹, set on the Cash Out screen. Undefined until entered. */
  cashOut?: number;
};

/** One rung of the stack: a denomination and how many of it each player gets. */
export type DenomRung = {
  value: number;
  qtyPerPlayer: number;
};

export type ChipPlanCore = {
  buyIn: number;
  rungs: DenomRung[];
  /** total chips in one starting stack */
  totalChipsPerPlayer: number;
  /** the stack's total face value in chips (Σ qty × value) — not rupees */
  stackInChips: number;
  /** how many "in chips" make ₹1. 1 means chips are rupees; 2 means 2-in-chips = ₹1. */
  chipsPerRupee: number;
  /** small/big blind, in chips (divide by chipsPerRupee for ₹) */
  smallBlind: number;
  bigBlind: number;
  bigBlindsInStack: number;
  /** how many of each denomination are left in the box after handing out `plannedBuyIns` stacks, keyed by value */
  remainingInBox: Record<number, number>;
  /** lower is better; used to rank alternative plans */
  score: number;
};

export type ChipPlan = ChipPlanCore & {
  ok: true;
  /** next-best alternatives, best first (cheap to compute, shown as "other options") */
  alternatives: ChipPlanCore[];
};

export type ChipPlanFailure = {
  ok: false;
  reason: string;
  suggestions: string[];
};

export type ChipPlanResult = ChipPlan | ChipPlanFailure;

export type GameSetup = {
  buyInAmount: number;
  plannedBuyIns: number;
  inventory: ChipDenom[];
};

export type Game = {
  id: string;
  createdAt: number;
  finishedAt?: number;
  setup: GameSetup;
  chipPlan: ChipPlanResult | null;
  players: Player[];
};

export type Payment = {
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
  paid: boolean;
};

export type SettleResult =
  | { ok: true; nets: Record<string, number>; payments: Payment[] }
  | { ok: false; reason: string; totalMismatch: number };

export type Screen =
  | "home"
  | "whosPlaying"
  | "buyIn"
  | "chipsBox"
  | "chipPlan"
  | "liveGame"
  | "cashOut"
  | "settle"
  | "history";

/** The only denominations this app knows — what's printed on real chips.
 * A group missing a denomination sets its count to 0. */
export const DEFAULT_INVENTORY: ChipDenom[] = [5, 10, 25, 50, 100].map((value) => ({ value, count: 40 }));
