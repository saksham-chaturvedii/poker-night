// Everything lives in one localStorage key. No backend, no login.

import type { Game } from "../types";

// v2: chips are modelled as fixed denominations + a chip-to-rupee rate
// instead of user-defined colours — v1 saves don't fit this shape, so bump
// the key and let old data fall away (no real games were riding on it yet).
const STORAGE_KEY = "pokerNight.v2";

export type StoredState = {
  activeGame: Game | null;
  history: Game[];
};

const EMPTY_STATE: StoredState = { activeGame: null, history: [] };

export function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw);
    return {
      activeGame: parsed.activeGame ?? null,
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    // Corrupt or blocked storage (private browsing, quota, etc.) — don't
    // crash the app, just start fresh in memory for this session.
    return EMPTY_STATE;
  }
}

export function saveState(state: StoredState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Best-effort — a full quota or blocked storage shouldn't crash the app.
  }
}
