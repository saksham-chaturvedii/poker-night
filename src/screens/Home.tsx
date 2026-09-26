import { useState } from "react";
import { MoneyAmount } from "../components/MoneyAmount";
import type { Game } from "../types";

type HomeProps = {
  activeGame: Game | null;
  history: Game[];
  onNewGame: () => void;
  onResume: () => void;
  onOpenHistory: () => void;
  onDeleteActive: () => void;
};

export function Home({ activeGame, history, onNewGame, onResume, onOpenHistory, onDeleteActive }: HomeProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const totalPot = activeGame?.players.reduce((a, p) => a + p.totalIn, 0) ?? 0;

  return (
    <div className="screen">
      <header className="screen-header screen-header-home">
        <h1 className="text-display">🃏 Poker Night</h1>
        <p className="subtitle">Set up chips, track buy-ins, and settle the table easily.</p>
      </header>
      <div className="screen-body">
        {activeGame &&
          (confirmDelete ? (
            <div className="active-game-block confirm-delete">
              <p className="text-body">Delete this in-progress game? This can't be undone.</p>
              <div className="confirm-delete-actions">
                <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    onDeleteActive();
                    setConfirmDelete(false);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="active-game-block">
              <button className="active-game-resume" onClick={onResume}>
                <div className="active-game-label">
                  <span className="text-section">Game in progress</span>
                  <span className="active-game-meta">{activeGame.players.length} players</span>
                </div>
                <MoneyAmount value={totalPot} variant="hero" />
                <span className="text-small">Tap to resume →</span>
              </button>
              <button
                className="icon-btn active-game-delete"
                aria-label="Delete this game"
                onClick={() => setConfirmDelete(true)}
              >
                🗑
              </button>
            </div>
          ))}

        <button className="btn btn-primary btn-large" onClick={onNewGame}>
          + New Game
        </button>

        {history.length > 0 && (
          <button className="btn btn-secondary btn-large" onClick={onOpenHistory}>
            Past games ({history.length})
          </button>
        )}
      </div>
    </div>
  );
}
